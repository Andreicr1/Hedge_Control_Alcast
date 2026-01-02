#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# -----------------------------
# Helpers
# -----------------------------
info() { echo "[dev] $*"; }
warn() { echo "[dev][warn] $*" >&2; }
err() { echo "[dev][err] $*" >&2; }

have_cmd() { command -v "$1" >/dev/null 2>&1; }

require_cmd() {
  if ! have_cmd "$1"; then
    err "Comando não encontrado: $1"
    exit 1
  fi
}

# Prefer python/py for cross-platform env-file editing
pick_py() {
  if have_cmd py; then
    echo "py -3.12"
  elif have_cmd python3; then
    echo "python3"
  else
    echo "python"
  fi
}

# Upsert KEY=VALUE into an .env file without destroying other keys/comments.
upsert_env_kv() {
  local file="$1"
  local key="$2"
  local value="$3"
  local pybin
  pybin="$(pick_py)"

  # shellcheck disable=SC2086
  $pybin -c "import os,re,sys
p=sys.argv[1]; k=sys.argv[2]; v=sys.argv[3]
if not os.path.exists(p):
  open(p,'w',encoding='utf-8').write(f'{k}={v}\\n'); sys.exit(0)
lines=open(p,'r',encoding='utf-8',errors='ignore').read().splitlines()
rx=re.compile(r'^\\s*'+re.escape(k)+r'\\s*=')
out=[]; replaced=False
for line in lines:
  if rx.match(line):
    out.append(f'{k}={v}')
    replaced=True
  else:
    out.append(line)
if not replaced:
  if out and out[-1].strip()!='':
    out.append('')
  out.append(f'{k}={v}')
open(p,'w',encoding='utf-8').write('\\n'.join(out).rstrip('\\n')+'\\n')
" "$file" "$key" "$value"
}

# Ensure a default value exists for KEY, but don't overwrite if already present.
ensure_env_kv_default() {
  local file="$1"
  local key="$2"
  local value="$3"
  if [[ -f "$file" ]] && grep -Eq "^[[:space:]]*${key}[[:space:]]*=" "$file"; then
    return 0
  fi
  upsert_env_kv "$file" "$key" "$value"
}

# Prefer curl if available; fallback to python (works on Windows with py/python)
http_get_status() {
  local url="$1"
  if have_cmd curl; then
    curl -s -o /dev/null -w "%{http_code}" "$url" || true
    return 0
  fi
  if have_cmd py; then
    py -3.12 -c "import urllib.request,sys;
try:
  r=urllib.request.urlopen('$url', timeout=3);
  sys.stdout.write(str(getattr(r,'status',200)));
except Exception:
  sys.stdout.write('000')" 2>/dev/null || echo "000"
    return 0
  fi
  if have_cmd python; then
    python -c "import urllib.request,sys;
try:
  r=urllib.request.urlopen('$url', timeout=3);
  sys.stdout.write(str(getattr(r,'status',200)));
except Exception:
  sys.stdout.write('000')" 2>/dev/null || echo "000"
    return 0
  fi
  echo "000"
}

ensure_env_file() {
  local path="$1"
  local content="$2"
  if [[ -f "$path" ]]; then
    info "OK: $path existe"
  else
    info "Criando $path"
    printf "%s\n" "$content" > "$path"
  fi
}

# -----------------------------
# Pre-flight
# -----------------------------
require_cmd node
require_cmd npm

info "Node: $(node -v)"
info "npm:  $(npm -v)"

# -----------------------------
# Frontend env (.env)
# -----------------------------
FRONT_ENV="${ROOT_DIR}/.env"
ensure_env_file "$FRONT_ENV" \
"VITE_API_URL=http://localhost:8000
VITE_USE_MOCK_DATA=false
"
ensure_env_kv_default "$FRONT_ENV" "VITE_API_URL" "http://localhost:8000"
ensure_env_kv_default "$FRONT_ENV" "VITE_API_PREFIX" "/api/v1"

# -----------------------------
# Backend env (backend/.env)
# -----------------------------
BACK_ENV="${ROOT_DIR}/backend/.env"
ensure_env_file "$BACK_ENV" \
"ENVIRONMENT=dev
API_V1_STR=/api/v1
# IMPORTANTE: defina um SECRET_KEY forte (sem isso o backend pode falhar)
SECRET_KEY=change-me-please
DATABASE_URL=postgresql+psycopg://postgres:Postgres@localhost:5432/alcast_db

# Scheduler Westmetall (job diário 09:00 UTC). Em dev, recomendo desligar:
SCHEDULER_ENABLED=false

# Evita travar caso Postgres não esteja disponível
DB_CONNECT_TIMEOUT_SECONDS=10
"

# Keep frontend/back-end API prefix aligned (frontend default is /api/v1).
upsert_env_kv "$BACK_ENV" "API_V1_STR" "/api/v1"
ensure_env_kv_default "$BACK_ENV" "ENVIRONMENT" "dev"
ensure_env_kv_default "$BACK_ENV" "DB_CONNECT_TIMEOUT_SECONDS" "10"

# Default scheduler off for dev, but allow override via env var on invocation:
#   BACKEND_SCHEDULER_ENABLED=true ./dev.sh
upsert_env_kv "$BACK_ENV" "SCHEDULER_ENABLED" "${BACKEND_SCHEDULER_ENABLED:-false}"

# Do not overwrite SECRET_KEY if user already set it.
ensure_env_kv_default "$BACK_ENV" "SECRET_KEY" "change-me-please"

# Always set a usable dev DATABASE_URL (can be overridden per-run):
#   BACKEND_DATABASE_URL="postgresql+psycopg://user:pass@host:5432/db" ./dev.sh
upsert_env_kv "$BACK_ENV" "DATABASE_URL" "${BACKEND_DATABASE_URL:-postgresql+psycopg://postgres:Postgres@localhost:5432/alcast_db}"

# -----------------------------
# Install deps (frontend)
# -----------------------------
if [[ ! -d "${ROOT_DIR}/node_modules" ]]; then
  info "node_modules não encontrado. Rodando npm install..."
  (cd "${ROOT_DIR}" && npm install)
else
  info "node_modules OK"
fi

# -----------------------------
# Start processes
# -----------------------------
cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then kill "${BACKEND_PID}" 2>/dev/null || true; fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then kill "${FRONTEND_PID}" 2>/dev/null || true; fi
}
trap cleanup INT TERM EXIT

PY_BIN="${PYTHON_BIN:-}"
if [[ -z "${PY_BIN}" ]]; then
  if have_cmd py; then PY_BIN="py -3.12"
  elif have_cmd python3; then PY_BIN="python3"
  else PY_BIN="python"
  fi
fi

info "Subindo backend (uvicorn)..."
(
  cd "${ROOT_DIR}/backend"
  # shellcheck disable=SC2086
  $PY_BIN -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

# Espera backend responder no /api/v1/health (alinhado ao API_V1_STR)
info "Aguardando backend responder em /api/v1/health..."
for i in {1..30}; do
  code="$(http_get_status "http://localhost:8000/api/v1/health")"
  if [[ "$code" == "200" ]]; then
    info "Backend OK (200)"
    break
  fi
  sleep 1
done

info "Subindo frontend (Vite)..."
(
  cd "${ROOT_DIR}"
  npm run dev -- --host --port 5173
) &
FRONTEND_PID=$!

info "Backend PID: ${BACKEND_PID}"
info "Frontend PID: ${FRONTEND_PID}"
info "Acesse: http://localhost:5173"
info "Ctrl+C para parar ambos."

wait
