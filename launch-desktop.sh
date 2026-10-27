#!/usr/bin/env bash
# LEVEL 23 Legal AI Suite - macOS / Linux Desktop Launcher

echo "======================================================================="
echo "    LEVEL 23 LEGAL AI SUITE - DESKTOP & ON-PREMISES CONNECTOR         "
echo "======================================================================="

BASE_DIR="$HOME/iiiamadex"
mkdir -p "$BASE_DIR"

echo "[1/3] Configuring Ollama Local AI CORS on port 11434..."
export OLLAMA_ORIGINS="*"
if command -v ollama >/dev/null 2>&1; then
  ollama serve >/dev/null 2>&1 &
  echo "[OK] Ollama Local AI Daemon initialized on http://localhost:11434"
fi

echo "[2/3] Starting local storage bridge daemon on port 4321..."
node iiiamadex-desktop-bridge.js &

echo "[3/3] Launching Level 23 Legal Suite in browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:3000"
else
  xdg-open "http://localhost:3000" || sensible-browser "http://localhost:3000"
fi

echo "[SUCCESS] Level 23 Legal Suite running."
