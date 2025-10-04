import os, sys, subprocess
from pathlib import Path
from ..config import MUSETALK_DIR

def lipsync(video_in: Path, audio_in: Path, out_video: Path) -> Path:
    """
    MuseTalk repo (scripts/inference.py veya app.py) üzerinden lipsync dener.
    Başarısızsa exception fırlatır; backend bunu yakalayıp mux'a düşer.
    """
    repo = MUSETALK_DIR
    log = out_video.with_suffix(".musetalk.log")
    if not repo.exists():
        raise FileNotFoundError(f"MuseTalk repo not found: {repo}")
    # En yaygın giriş noktası
    candidates = [
        [sys.executable, "scripts/inference.py",
         "--inference_config", "configs/inference/test.yaml",
         "--result_dir", str(out_video.parent),
         "--unet_model_path", "models/musetalkV15/unet.pth",
         "--unet_config", "models/musetalkV15/musetalk.json",
         "--version", "v15",
         "--ffmpeg_path", ""  # Linux'ta PATH'teki ffmpeg'i kullan
        ],
        [sys.executable, "app.py", "--use_float16"]
    ]
    # Sadece repo'yu doğrula; gerçek argümanlar senin kurulumuna göre değişebilir.
    with open(log, "w", buffering=1) as lf:
        for cmd in candidates:
            lf.write(f"[TRY] {' '.join(cmd)}\n[CWD] {repo}\n\n")
            try:
                p = subprocess.Popen(cmd, cwd=str(repo),
                                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                     text=True, bufsize=1)
                for line in p.stdout:
                    lf.write(line); print(line, end="", flush=True)
                p.wait()
                if p.returncode == 0 and out_video.exists():
                    return out_video
            except Exception as e:
                lf.write(f"[EXC] {e}\n")
    raise RuntimeError(f"MuseTalk failed. See log: {log}")

