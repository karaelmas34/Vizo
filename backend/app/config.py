import os
from pathlib import Path

HOME = Path.home()
BACKEND_ROOT = Path(__file__).resolve().parents[2]

# WAN repo/ckpt: önce ENV, sonra backend/models fallback
DEFAULT_WAN_REPO = Path(os.environ.get("WAN22_REPO", str(BACKEND_ROOT / "models" / "Wan2.2")))
DEFAULT_WAN_CKPT_TI2V5B = Path(os.environ.get(
    "WAN22_TI2V5B_CKPT",
    str(BACKEND_ROOT / "models" / "Wan2.2-TI2V-5B")
))

# Çıktılar
OUTPUT_DIR = Path(os.environ.get("VIZOAI_OUTPUT_DIR", str(HOME / "dev" / ".VizoAi" / "outputs")))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# JWT/DB
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
ALGORITHM = os.environ.get("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
DB_PATH = Path(os.environ.get("VIZOAI_DB_PATH", str((HOME / "dev" / ".VizoAi" / "backend" / "vizoai.db"))))

# CUDA
CUDA_DEVICE = os.environ.get("CUDA_DEVICE", "cuda:0")
GPU_MEMORY_FRACTION = float(os.environ.get("GPU_MEMORY_FRACTION", "0.9"))

# Binaries
FFMPEG_BIN = os.environ.get("FFMPEG_BIN", "ffmpeg")
PIPER_BIN = os.environ.get("PIPER_BIN", "piper")

# Optional Piper voices
PIPER_VOICE_FEMALE = os.environ.get("PIPER_VOICE_FEMALE", "")
PIPER_VOICE_MALE = os.environ.get("PIPER_VOICE_MALE", "")

# MuseTalk: önce ENV, sonra backend/models fallback
ENABLE_MUSETALK = os.environ.get("ENABLE_MUSETALK", "0") == "1"
MUSETALK_DIR = Path(os.environ.get("MUSETALK_DIR", str(BACKEND_ROOT / "models" / "MuseTalk")))

DB_PATH.parent.mkdir(parents=True, exist_ok=True)
