#!/usr/bin/env bash
set -e

ROOT="$HOME/dev/.VizoAi"

# Uygun terminal emülatörünü seç (gnome-terminal yoksa konsole/xterm)
open_term() {
  title="$1"; cmd="$2"
  if command -v gnome-terminal >/dev/null 2>&1; then
    gnome-terminal --title="$title" -- bash -lc "$cmd"
  elif command -v konsole >/dev/null 2>&1; then
    konsole -p tabtitle="$title" -e bash -lc "$cmd"
  elif command -v xterm >/dev/null 2>&1; then
    xterm -T "$title" -e bash -lc "$cmd"
  else
    # terminal bulunamazsa arka planda çalıştır (log dosyasına)
    nohup bash -lc "$cmd" > \"$ROOT/$title.log\" 2>&1 &
  fi
}

# BACKEND komutu
BACKEND_CMD='
set -e
cd "$HOME/dev/.VizoAi/backend"
python3 -m venv .venv >/dev/null 2>&1 || true
source .venv/bin/activate
pip -q install -r requirements.txt

export WAN22_REPO="$HOME/dev/Wan2.2"
export WAN22_TI2V5B_CKPT="$HOME/dev/.VizoAi/backend/models/Wan2.2-TI2V-5B"
export VIZOAI_OUTPUT_DIR="$HOME/dev/.VizoAi/outputs"

./run.sh
'

# FRONTEND komutu (package.json nerede ise otomatik bulur)
FRONTEND_CMD='
set -e
FR_ROOT=$(dirname "$(find "$HOME/dev/.VizoAi" -maxdepth 3 -type f -name package.json | head -n1)")
if [ -z "$FR_ROOT" ]; then
  echo "Frontend bulunamadı (package.json yok)."; read -p "Enter tuşu ile kapatın..."; exit 1
fi
cd "$FR_ROOT"

[ -f .env.local ] || echo "VITE_API_BASE_URL=http://127.0.0.1:8001" > .env.local

if [ -f pnpm-lock.yaml ]; then
  corepack enable || true
  pnpm install
  pnpm run dev -- --host 0.0.0.0 --port 3000
elif [ -f yarn.lock ]; then
  yarn install
  yarn dev --host 0.0.0.0 --port 3000
else
  npm install
  npm run dev -- --host 0.0.0.0 --port 3000
fi
'

open_term "VizoAI Backend"   "$BACKEND_CMD"
open_term "VizoAI Frontend"  "$FRONTEND_CMD"

