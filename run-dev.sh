#!/usr/bin/env bash

# Start backend (FastAPI/uvicorn) and frontend (Vite) together.
# Usage: bash run-dev.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Ensure we clean up both processes on exit
cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi
}
trap cleanup INT TERM EXIT

PY_BIN="${PYTHON_BIN:-python}"
if ! command -v "$PY_BIN" >/dev/null 2>&1; then
  for cand in python3 py; do
    if command -v "$cand" >/dev/null 2>&1; then
      PY_BIN="$cand"
      break
    fi
  done
fi

echo "Using Python: $PY_BIN"
echo "Starting backend (uvicorn)..."
(
  cd "${ROOT_DIR}/backend"
  # Uses backend/.env for DATABASE_URL and other settings
  "$PY_BIN" -m uvicorn app.main:app --reload --port 8000
) &
BACKEND_PID=$!

echo "Starting frontend (Vite)..."
(
  cd "${ROOT_DIR}"
  npm run dev -- --host --port 5173
) &
FRONTEND_PID=$!

echo "Backend PID: ${BACKEND_PID}"
echo "Frontend PID: ${FRONTEND_PID}"
echo "Press Ctrl+C to stop both."

wait
