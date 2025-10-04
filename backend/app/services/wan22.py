import os
import sys
import uuid
import subprocess
from pathlib import Path
from typing import Tuple

from ..config import DEFAULT_WAN_REPO, DEFAULT_WAN_CKPT_TI2V5B, OUTPUT_DIR

# ti2v-5B yalnızca bu iki pikseli kabul eder:
# landscape -> 1280x704
# portrait  -> 704x1280
def size_from_aspect_and_res(aspect: str, resolution: str) -> Tuple[int, int]:
    a = (aspect or "16:9").strip()
    return (704, 1280) if a == "9:16" else (1280, 704)

def _resolve_paths(wan_repo: Path, ckpt_dir: Path) -> tuple[Path, Path]:
    """
    ENV veya config bozuksa da her zaman backend/models/... altına düş.
    """
    backend_root = Path(__file__).resolve().parents[2]
    hard_fallback_repo = backend_root / "models" / "Wan2.2"
    hard_fallback_ckpt = backend_root / "models" / "Wan2.2-TI2V-5B"

    # Başlangıçta verilenleri dene
    repo = Path(wan_repo) if wan_repo else hard_fallback_repo
    ckpt = Path(ckpt_dir) if ckpt_dir else hard_fallback_ckpt

    # Repo geçerli mi? (klasör + generate.py)
    if not repo.exists() or not (repo / "generate.py").exists():
        repo = hard_fallback_repo

    # Ckpt geçerli mi?
    if not ckpt.exists():
        ckpt = hard_fallback_ckpt

    return repo, ckpt

def _low_vram_env(base_env: dict) -> dict:
    env = base_env.copy()
    env.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True,max_split_size_mb:64")
    env.setdefault("ATTN_IMPLEMENTATION", "xformers")
    env.setdefault("CUDA_LAUNCH_BLOCKING", "0")
    env.setdefault("PYTHONUNBUFFERED", "1")
    return env

def run_ti2v(image_path: str, prompt: str, aspect: str, resolution: str,
             wan_repo: Path = DEFAULT_WAN_REPO,
             ckpt_dir: Path = DEFAULT_WAN_CKPT_TI2V5B) -> Path:
    """
    WAN ti2v-5B’yi doğru boyutlarla çalıştırır; stdout canlı olarak wan_log.txt’ye akar.
    Çıktı: OUTPUT_DIR/wan/<id>/result.mp4
    """
    outdir = OUTPUT_DIR / "wan" / uuid.uuid4().hex[:8]
    outdir.mkdir(parents=True, exist_ok=True)
    log_path = outdir / "wan_log.txt"

    repo, ckpt = _resolve_paths(wan_repo, ckpt_dir)

    img = Path(image_path)
    if not img.exists():
        log_path.write_text(f"[ERROR] image not found: {img}\n")
        raise FileNotFoundError(f"image not found: {img}")

    gen_py = repo / "generate.py"
    if not gen_py.exists():
        log_path.write_text(f"[ERROR] generate.py not found in repo: {gen_py}\n")
        raise FileNotFoundError(f"generate.py not found: {gen_py}")

    if not ckpt.exists():
        log_path.write_text(f"[ERROR] ckpt dir not found: {ckpt}\n")
        raise FileNotFoundError(f"ckpt dir not found: {ckpt}")

    w, h = size_from_aspect_and_res(aspect, resolution)
    cmd = [
        sys.executable, "generate.py",
        "--task", "ti2v-5B",
        "--size", f"{w}*{h}",
        "--ckpt_dir", str(ckpt),
        "--offload_model", "True",
        "--convert_model_dtype",
        "--t5_cpu",
        "--image", str(img),
        "--prompt", (prompt or ""),
    ]

    env = _low_vram_env(os.environ)

    # canlı log
    with log_path.open("w", buffering=1) as lf:
        lf.write(f"[CMD] {' '.join(cmd)}\n[CWD] {repo}\n\n")
        proc = subprocess.Popen(
            cmd, cwd=str(repo), env=env,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, bufsize=1
        )
        try:
            for line in proc.stdout:
                lf.write(line)
                print(line, end="", flush=True)
        finally:
            proc.wait()
        rc = proc.returncode
        lf.write(f"\n[RETURN CODE] {rc}\n")
        if rc != 0:
            raise RuntimeError(f"WAN generate.py exit code {rc}. See log: {log_path}")

    # mp4’ü bul
    mp4s = sorted(Path(repo).rglob("*.mp4"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not mp4s:
        mp4s = sorted(outdir.rglob("*.mp4"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not mp4s:
        raise RuntimeError(f"WAN did not produce mp4. Check log: {log_path}")

    dst = outdir / "result.mp4"
    if mp4s[0].parent == outdir:
        mp4s[0].replace(dst)
    else:
        import shutil; shutil.copy2(mp4s[0], dst)
    return dst

