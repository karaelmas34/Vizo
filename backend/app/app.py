import os, uuid, json
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from PIL import Image

from .db import init_db, migrate_schema, engine, SessionLocal, User, Job, Upload, Face, DialogueLog
from .auth import get_db, get_current_user, get_password_hash, verify_password, create_access_token
from .schemas import UploadResponse, GeneratePayload
from .services.face_detect import detect_faces, choose_aspect_from_image
from .services.wan22 import run_ti2v
from .services.tts_piper import synthesize_dialogues
from .services.mux import mux_audio_to_video
from .config import OUTPUT_DIR, ENABLE_MUSETALK

try:
    from .services.musetalk import lipsync
except Exception:
    lipsync = None


# ---------- CONST / ENV ----------
PIPER_VOICES_DIR = Path(os.getenv("PIPER_VOICES_DIR", "/workspace/models/piper-voices"))
DEFAULT_TTS_FEMALE = os.getenv("DEFAULT_TTS_FEMALE", "")
DEFAULT_TTS_MALE = os.getenv("DEFAULT_TTS_MALE", "")


# ---------- ADMIN SEED ----------
def seed_admin_if_missing():
    with SessionLocal() as db:
        exists = db.query(User).filter(User.email == "admin@vizo.ai").first()
        if exists:
            return
        admin = User(
            name="Admin",
            email="admin@vizo.ai",
            password_hash=get_password_hash("Karaelmas.034"),
            role="admin",
            credits=1000,
        )
        db.add(admin)
        try:
            db.commit()
        except Exception:
            db.rollback()


# ---------- APP ----------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="VizoAI Backend", version="0.8.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# idempotent init
init_db(); migrate_schema(engine); seed_admin_if_missing()

@app.on_event("startup")
def _startup():
    init_db(); migrate_schema(engine); seed_admin_if_missing()


# ---------- BASIC ----------
@app.get("/api/ping")
def ping():
    return {"ok": True, "message": "VizoAI backend online"}

@app.get("/health")
def health():
    # basit mount kontrolü, opsiyonel
    voices_ok = PIPER_VOICES_DIR.exists()
    return {"ok": True, "voices_mounted": voices_ok, "voices_dir": str(PIPER_VOICES_DIR)}


# ---------- HELPERS ----------
def _rel_url(p: Path) -> str:
    try:
        rel = Path(p).resolve().relative_to(OUTPUT_DIR.resolve())
        return f"/outputs/{rel.as_posix()}"
    except Exception:
        return str(p)

def _to_local_image_path(img_path: str) -> str:
    from urllib.parse import urlparse
    if img_path.startswith("/outputs/"):
        rel = img_path[len("/outputs/"):]
        return str(OUTPUT_DIR / rel)
    if img_path.startswith("http://") or img_path.startswith("https://"):
        u = urlparse(img_path)
        if u.path.startswith("/outputs/"):
            rel = u.path[len("/outputs/"):]
            return str(OUTPUT_DIR / rel)
    return img_path

def _center_crop_to_aspect(img_path: Path, target_aspect: str) -> Path:
    img = Image.open(img_path).convert("RGB")
    w, h = img.size
    if target_aspect == "9:16":
        tw, th = 9, 16
    else:
        target_aspect = "16:9"
        tw, th = 16, 9
    ar_src = w / h
    ar_tgt = tw / th
    if abs(ar_src - ar_tgt) < 1e-3:
        crop_img = img
    elif ar_src > ar_tgt:
        new_w = int(h * ar_tgt)
        left = max(0, (w - new_w) // 2)
        crop_img = img.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / ar_tgt)
        top = max(0, (h - new_h) // 2)
        crop_img = img.crop((0, top, w, top + new_h))
    out_dir = OUTPUT_DIR / "inputs"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{Path(img_path).stem}__crop.jpg"
    crop_img.save(out_path, format="JPEG", quality=95)
    return out_path


# ---------- AUTH ----------
@app.post("/auth/register")
async def register(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        body = await request.form()
    name = (body.get("name") or body.get("fullName") or "User").strip()
    email = (body.get("email") or "").strip()
    password = body.get("password")
    if not email or not password:
        raise HTTPException(status_code=422, detail="Missing email or password")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=name, email=email, password_hash=get_password_hash(password))
    db.add(user); db.commit(); db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return {"ok": True, "token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "credits": user.credits}}

@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        body = await request.form()
    email = (body.get("email") or "").strip()
    password = body.get("password")
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    import datetime as _dt
    user.last_login = _dt.datetime.utcnow(); db.commit()
    token = create_access_token({"sub": str(user.id)})
    return {"ok": True, "token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "credits": user.credits}}


# ---------- UPLOAD ----------
@app.post("/api/upload")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = uuid.uuid4().hex[:8]
    up_dir = OUTPUT_DIR / "uploads"
    up_dir.mkdir(parents=True, exist_ok=True)
    out_path = up_dir / f"{uid}_{file.filename}"
    with open(out_path, "wb") as f:
        f.write(await file.read())

    try:
        im = Image.open(out_path); w, h = im.size
    except Exception:
        w = h = 0
    up = Upload(user_id=(current_user.id if current_user else None), path=str(out_path), w=w, h=h, preview_url=None)
    db.add(up); db.commit()

    faces = detect_faces(str(out_path))
    url = f"/outputs/uploads/{out_path.name}"
    return {"path": url, "faces": faces}


# ---------- JOB STATUS ----------
@app.get("/api/jobs/{job_id}")
def job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": job.status, "video_path": job.video_path, "error": job.error}


# ---------- TTS: VOICE DISCOVERY ----------
def _scan_piper_voices() -> List[Dict[str, Any]]:
    """
    PIPER_VOICES_DIR altında **/*.onnx dosyalarını bulur.
    Her biri için {id,label,path,lang,name} döner.
    """
    items: List[Dict[str, Any]] = []
    if not PIPER_VOICES_DIR.exists():
        return items

    for onnx in PIPER_VOICES_DIR.rglob("*.onnx"):
        rel = onnx.relative_to(PIPER_VOICES_DIR)
        parts = rel.parts
        lang = parts[0] if len(parts) > 1 else "unknown"
        base = onnx.stem  # 'en_US-amy-medium'
        label = f"{lang} · {base}"
        items.append({
            "id": str(rel).replace("/", "__"),
            "label": label,
            "path": str(onnx),
            "lang": lang,
            "name": base,
            "config": (str(onnx) + ".json") if (onnx.parent / (onnx.name + ".json")).exists() else None,
        })
    # alfabetik tek tip
    items.sort(key=lambda x: (x["lang"], x["name"]))
    return items

@app.get("/api/tts/voices")
def list_voices():
    """
    Frontend drop-down bu endpoint’i çağıracak.
    """
    return {
        "ok": True,
        "dir": str(PIPER_VOICES_DIR),
        "count": len(_scan_piper_voices()),
        "voices": _scan_piper_voices(),
        "defaults": {"female": DEFAULT_TTS_FEMALE, "male": DEFAULT_TTS_MALE},
    }


# ---------- GENERATION PIPELINE ----------
def _run_generation(job_id: str):
    db = SessionLocal()
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return
        import datetime as _dt
        job.status = "running"; job.updated_at = _dt.datetime.utcnow(); db.commit()

        # 1) SES
        audio_dir = OUTPUT_DIR / "audio"; audio_dir.mkdir(parents=True, exist_ok=True)
        audio_path = audio_dir / f"{job.id}.wav"
        try:
            dialogues = json.loads(job.dialogues_json or "[]")
        except Exception:
            dialogues = []
        if dialogues:
            synthesize_dialogues(dialogues, audio_path)
        else:
            from pydub import AudioSegment
            AudioSegment.silent(duration=1000).export(audio_path, format="wav")

        # 2) GÖRSEL + WAN
        src = Path(job.image_path)
        if not src.exists():
            raise FileNotFoundError(f"image not found: {src}")
        aspect = job.aspect or choose_aspect_from_image(str(src))
        cropped = _center_crop_to_aspect(src, aspect)
        base_video = run_ti2v(str(cropped), job.prompt, aspect, job.resolution)

        # 3) LIPSYNC→mux
        final_video = base_video
        if ENABLE_MUSETALK and lipsync is not None:
            try:
                synced = base_video.parent / f"{base_video.stem}_synced.mp4"
                lipsync(base_video, audio_path, synced)
                if synced.exists():
                    final_video = synced
            except Exception:
                pass

        if final_video == base_video:
            try:
                with_audio = base_video.parent / f"{base_video.stem}_with_audio.mp4"
                mux_audio_to_video(base_video, audio_path, with_audio)
                if with_audio.exists():
                    final_video = with_audio
            except Exception:
                final_video = base_video

        job.video_path = _rel_url(final_video)
        job.status = "done"; job.updated_at = _dt.datetime.utcnow(); db.commit()

    except Exception as e:
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            import datetime as _dt
            job.status = "error"; job.error = str(e); job.updated_at = _dt.datetime.utcnow(); db.commit()
    finally:
        db.close()

@app.post("/api/generate-s2v")
def generate(payload: GeneratePayload, bg: BackgroundTasks, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job_id = uuid.uuid4().hex[:12]
    imgp = _to_local_image_path(payload.imagePath)
    p = Path(imgp)
    if not p.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    aspect = (payload.aspect or choose_aspect_from_image(str(p)))

    job = Job(
        id=job_id,
        job_uid=uuid.uuid4().hex[:10],
        user_id=current_user.id if current_user else None,
        image_path=str(p),
        aspect=aspect,
        resolution=payload.resolution,
        prompt=payload.prompt or payload.settings.scenePrompt or "",
        dialogues_json=json.dumps([d.dict() for d in payload.dialogues]) if payload.dialogues else "[]",
        status="queued"
    )
    db.add(job); db.commit()
    bg.add_task(_run_generation, job_id)
    return {"job_id": job_id}


# ---------- STATIC OUTPUTS ----------
@app.get("/outputs/{path:path}")
def get_output(path: str):
    fpath = OUTPUT_DIR / path
    if not fpath.exists():
        raise HTTPException(status_code=404, detail="file not found")
    return FileResponse(str(fpath))
