#!/usr/bin/env bash

# Dev deploy helper: start backend (uvicorn) and frontend (Vite) with sensible defaults.
# Usage: bash deploy-dev.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

echo "[dev-deploy] Using Python: $PY_BIN"
echo "[dev-deploy] Backend env: ${ROOT_DIR}/backend/.env"
echo "[dev-deploy] Frontend env: ${ROOT_DIR}/.env"

# Backend
echo "[dev-deploy] Starting backend (uvicorn, host 0.0.0.0:8000)..."
(
  cd "${ROOT_DIR}/backend"
  "$PY_BIN" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

# Frontend
echo "[dev-deploy] Starting frontend (Vite on 0.0.0.0:5173)..."
(
  cd "${ROOT_DIR}"
  npm run dev -- --host --port 5173
) &
FRONTEND_PID=$!

echo "[dev-deploy] Backend PID: ${BACKEND_PID}"
echo "[dev-deploy] Frontend PID: ${FRONTEND_PID}"
echo "[dev-deploy] Press Ctrl+C to stop both processes."

wait
