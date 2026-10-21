#!/usr/bin/env bash
# Deploys the web app (nginx + built React app) to the VPS as container `bidaro-frontend`.
# The search API it proxies (/api/search → bidigo-search) and the mail worker come from bidaro-backend.
# Locally: values from .env. In GitHub Actions: from repository secrets (see .github/SECRETS.md).
set -euo pipefail

VPS_HOST="${VPS_HOST:-72.61.177.37}"
VPS_USER="${VPS_USER:-root}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/memorlee-deploy}"
APP_NAME="${APP_NAME:-bidaro-frontend}"
HOST_HTTP_PORT="${HOST_HTTP_PORT:-9088}"
REMOTE_DIR="/opt/${APP_NAME}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -f "${ROOT}/.env" ]]; then
  # shellcheck disable=SC1091
  set -a
  source "${ROOT}/.env"
  set +a
fi

VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-}"
VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}"
if [[ -z "${VITE_SUPABASE_URL}" || -z "${VITE_SUPABASE_ANON_KEY}" ]]; then
  echo "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (.env or environment)"
  exit 1
fi

SSH="ssh -i ${SSH_KEY} -o StrictHostKeyChecking=accept-new"

echo "→ Syncing files to ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}"
rsync -az --delete \
  -e "${SSH}" \
  --exclude .git \
  --exclude .github \
  --exclude node_modules \
  --exclude dist \
  --exclude .env \
  --exclude smoke \
  --exclude landing \
  --exclude deploy \
  "${ROOT}/" \
  "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/"

echo "→ Building and starting ${APP_NAME} on the VPS"
${SSH} "${VPS_USER}@${VPS_HOST}" bash -s <<REMOTE
set -euo pipefail
docker network create apps-net 2>/dev/null || true
cd ${REMOTE_DIR}

docker build \
  --build-arg VITE_SUPABASE_URL='${VITE_SUPABASE_URL}' \
  --build-arg VITE_SUPABASE_ANON_KEY='${VITE_SUPABASE_ANON_KEY}' \
  -t ${APP_NAME}:latest .

cat > docker-compose.prod.yml << 'COMPOSE'
services:
  frontend:
    image: bidaro-frontend:latest
    container_name: bidaro-frontend
    restart: always
    ports:
      - "${HOST_HTTP_PORT}:80"
    networks:
      - apps-net
networks:
  apps-net:
    external: true
COMPOSE

# Monorepo era: the web container was called janusz-licytuje and held port ${HOST_HTTP_PORT}
docker rm -f janusz-licytuje 2>/dev/null || true
docker compose -p ${APP_NAME} -f docker-compose.prod.yml up -d --force-recreate --remove-orphans
REMOTE

echo "✓ Bidaro web: http://${VPS_HOST}:${HOST_HTTP_PORT}"
