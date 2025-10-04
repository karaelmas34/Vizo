#!/usr/bin/env bash
set -Eeuo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

# venv'i aktive et
if [[ -z "${VIRTUAL_ENV:-}" && -f "$HERE/.venv/bin/activate" ]]; then
  source "$HERE/.venv/bin/activate"
fi

# CUDA 12.1 için PyTorch tekerleri
pip install --upgrade pip
pip install --index-url https://download.pytorch.org/whl/cu121 \
  torch torchvision torchaudio

# WAN core + S2V + Animate gereksinimleri (senin dosyaların)
WAN_DIR="$HERE/models/Wan2.2"
REQ_CORE="$WAN_DIR/requirements.txt"
REQ_S2V="$WAN_DIR/requirements_s2v.txt"
REQ_ANIM="$WAN_DIR/requirements_animate.txt"

# Ek olarak sık kullanılanlar (bazıları requirements'larda zaten var)
EXTRAS=(
  "xformers"
  "einops"
  "safetensors"
  "transformers>=4.49.0,<=4.51.3"
  "accelerate>=1.1.1"
  "timm"
  "sentencepiece"
)

# Core dosyaları sırayla kur
[[ -f "$REQ_CORE" ]] && pip install -r "$REQ_CORE" || echo "WARN: $REQ_CORE yok"
[[ -f "$REQ_S2V"  ]] && pip install -r "$REQ_S2V"  || echo "WARN: $REQ_S2V yok"
[[ -f "$REQ_ANIM" ]] && pip install -r "$REQ_ANIM" || echo "WARN: $REQ_ANIM yok"

# Ekler
pip install "${EXTRAS[@]}"

# flash-attn: teker varsa kur, yoksa atla (Ampere 8.6, CUDA12.1'de çoğu zaman hazır gelir)
set +e
pip install --no-cache-dir flash-attn
FLASH_RC=$?
set -e
if [[ $FLASH_RC -ne 0 ]]; then
  echo "WARN: flash-attn kurulamadı (wheel bulunamadı ya da derleme hatası). Şimdilik atlıyorum."
fi

# Sanity check
python - <<'PY'
import importlib, sys
mods = [
  "torch","torchvision","torchaudio",
  "transformers","accelerate","diffusers","tokenizers",
  "easydict","decord","onnxruntime","tqdm","imageio","imageio_ffmpeg",
  "sentencepiece","ftfy","numpy","opencv_python"
]
ok=True
for m in mods:
    try:
        importlib.import_module(m.replace("opencv_python","cv2"))
        print("[OK]", m)
    except Exception as e:
        ok=False
        print("[MISS]", m, "->", e)
if not ok:
    sys.exit(2)
PY

echo "✅ WAN bağımlılık kurulumu tamamlandı."
