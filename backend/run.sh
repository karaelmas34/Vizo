#!/usr/bin/env bash
# Güçlü ama güvenli: -u var; tüm değişkenler ${VAR:-} ile korunuyor
set -Eeuo pipefail

# === Çalışma dizini ===
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

# === Venv aktivasyonu (varsa) ===
if [[ -z "${VIRTUAL_ENV:-}" && -f "$HERE/.venv/bin/activate" ]]; then
  # shellcheck source=/dev/null
  source "$HERE/.venv/bin/activate"
fi

# === .env (varsa) otomatik yükle ===
if [[ -f "$HERE/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$HERE/.env"
  set +a
fi

# ---------- Yardımcı: path seçiciler (tüm env referansları güvenli) ----------
pick_wan_repo() {
  local -a CANDIDATES=(
    "${WAN22_REPO:-}"
    "$HOME/dev/Wan2.2"
    "$HOME/dev/wan2.2"
    "$HERE/models/Wan2.2"
    "$HERE/models/wan2.2"
  )
  for p in "${CANDIDATES[@]}"; do
    [[ -n "$p" ]] || continue
    if [[ -d "$p" && -f "$p/generate.py" ]]; then
      echo "$p"; return 0
    fi
  done
  return 1
}

pick_wan_ckpt() {
  local -a CANDIDATES=(
    "${WAN22_TI2V5B_CKPT:-}"
    "$HOME/dev/Wan2.2-TI2V-5B"
    "$HOME/dev/wan2.2-ti2v-5b"
    "$HERE/models/Wan2.2-TI2V-5B"
    "$HERE/models/wan2.2-ti2v-5b"
  )
  for p in "${CANDIDATES[@]}"; do
    [[ -n "$p" ]] || continue
    if [[ -d "$p" ]]; then
      echo "$p"; return 0
    fi
  done
  return 1
}

pick_musetalk_dir() {
  local -a CANDIDATES=(
    "${MUSETALK_DIR:-}"
    "$HOME/dev/MuseTalk"
    "$HOME/dev/musetalk"
    "$HERE/models/MuseTalk"
    "$HERE/models/musetalk"
  )
  for p in "${CANDIDATES[@]}"; do
    [[ -n "$p" ]] || continue
    if [[ -d "$p" ]]; then
      echo "$p"; return 0
    fi
  done
  return 1
}

# ---------- WAN yollarını OTOMATİK bul (boş çıkarsa fatal) ----------
WAN22_REPO="$(pick_wan_repo || echo "")"
WAN22_TI2V5B_CKPT="$(pick_wan_ckpt || echo "")"

if [[ -z "$WAN22_REPO" ]]; then
  cat >&2 <<'EOF'
FATAL: WAN22_REPO bulunamadı.
Denediğim konumlar:
  $HOME/dev/Wan2.2
  $HOME/dev/wan2.2
  backend/models/Wan2.2
Lütfen Wan2.2 reposunu bu konumlardan birine koy (içinde generate.py olmalı)
veya .env içine WAN22_REPO=<path> yaz.
EOF
  exit 1
fi
if [[ -z "$WAN22_TI2V5B_CKPT" ]]; then
  cat >&2 <<'EOF'
FATAL: WAN22_TI2V5B_CKPT bulunamadı.
Denediğim konumlar:
  $HOME/dev/Wan2.2-TI2V-5B
  $HOME/dev/wan2.2-ti2v-5b
  backend/models/Wan2.2-TI2V-5B
Lütfen TI2V-5B checkpoint klasörünü bu konumlardan birine koy
veya .env içine WAN22_TI2V5B_CKPT=<path> yaz.
EOF
  exit 1
fi

# ---------- MuseTalk (opsiyonel) ----------
MUSETALK_DIR="$(pick_musetalk_dir || echo "")"

# ---------- Piper TTS ----------
# Piper bin: ENV -> /usr/local/bin/piper -> PATH
if [[ -n "${PIPER_BIN:-}" && -x "$(command -v "${PIPER_BIN}" || true)" ]]; then
  : # kullan
elif [[ -x "/usr/local/bin/piper" ]]; then
  PIPER_BIN="/usr/local/bin/piper"
else
  PIPER_BIN="$(command -v piper || echo "")"
fi

# Ses modelleri: ENV yoksa projedeki defaults
PIPER_VOICE_FEMALE="${PIPER_VOICE_FEMALE:-$HERE/models/piper-voices/tr_female.onnx}"
PIPER_VOICE_MALE="${PIPER_VOICE_MALE:-$HERE/models/piper-voices/tr_male.onnx}"

# ---------- FFmpeg ----------
FFMPEG_BIN="${FFMPEG_BIN:-$(command -v ffmpeg || echo /usr/bin/ffmpeg)}"

# ---------- Dışa aktar ----------
export WAN22_REPO WAN22_TI2V5B_CKPT
export MUSETALK_DIR
export PIPER_BIN PIPER_VOICE_FEMALE PIPER_VOICE_MALE
export FFMPEG_BIN

# ---------- Çıktılar & DB ----------
export VIZOAI_OUTPUT_DIR="${VIZOAI_OUTPUT_DIR:-$HOME/dev/.VizoAi/outputs}"
export VIZOAI_DB_PATH="${VIZOAI_DB_PATH:-$HERE/vizoai.db}"

# ---------- Yüz tespit ----------
export DISABLE_MEDIAPIPE_FACE="${DISABLE_MEDIAPIPE_FACE:-1}"

# ---------- VRAM dostu ----------
export PYTORCH_CUDA_ALLOC_CONF="${PYTORCH_CUDA_ALLOC_CONF:-expandable_segments:True,max_split_size_mb:64}"
export ATTN_IMPLEMENTATION="${ATTN_IMPLEMENTATION:-xformers}"
export CUDA_LAUNCH_BLOCKING="${CUDA_LAUNCH_BLOCKING:-0}"
export PYTHONUNBUFFERED=1

# ---------- Klasörler ----------
mkdir -p "$VIZOAI_OUTPUT_DIR"/{wan,uploads,inputs,audio,crops}
mkdir -p "$HERE/models/piper-voices"

# ---------- Özet ----------
echo "=========== VizoAI backend ==========="
echo "WAN22_REPO:         $WAN22_REPO"
echo "WAN22_TI2V5B_CKPT:  $WAN22_TI2V5B_CKPT"
echo "MuseTalk DIR:       ${MUSETALK_DIR:-<disabled>}"
echo "PIPER_BIN:          ${PIPER_BIN:-<not found>}"
echo "VOICE_FEMALE:       ${PIPER_VOICE_FEMALE:-<unset>}"
echo "VOICE_MALE:         ${PIPER_VOICE_MALE:-<unset>}"
echo "FFMPEG_BIN:         $FFMPEG_BIN"
echo "VIZOAI_OUTPUT_DIR:  $VIZOAI_OUTPUT_DIR"
echo "VIZOAI_DB_PATH:     $VIZOAI_DB_PATH"
echo "PYTORCH_CUDA_ALLOC: $PYTORCH_CUDA_ALLOC_CONF"
echo "======================================"

# ---------- DB init + migrate ----------
python3 - <<'PY'
from app.db import init_db, migrate_schema, engine
init_db(); migrate_schema(engine)
print("DB ready")
PY

# ---------- FastAPI ----------
exec uvicorn app.app:app --host 0.0.0.0 --port "${PORT:-8001}"

