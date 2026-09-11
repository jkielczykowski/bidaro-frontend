#!/usr/bin/env bash
set -euo pipefail

VPS_HOST="${VPS_HOST:-72.61.177.37}"
VPS_USER="${VPS_USER:-root}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/memorlee-deploy}"
APP_NAME="${APP_NAME:-janusz-licytuje}"
HOST_HTTP_PORT="${HOST_HTTP_PORT:-9088}"
REMOTE_DIR="/opt/${APP_NAME}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +a
fi

VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-}"
VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}"

if [[ -z "${VITE_SUPABASE_URL}" || -z "${VITE_SUPABASE_ANON_KEY}" ]]; then
  echo "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env"
  exit 1
fi

echo "→ Syncing files to ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}"
rsync -avz --delete \
  -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" \
  --exclude .git \
  --exclude node_modules \
  --exclude dist \
  --exclude .env \
  --exclude deploy \
  "${ROOT}/" \
  "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/"

echo "→ Building frontend on VPS"
ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" bash -s <<REMOTE
set -euo pipefail
docker network create apps-net 2>/dev/null || true
cd ${REMOTE_DIR}

docker build \
  --build-arg VITE_SUPABASE_URL='${VITE_SUPABASE_URL}' \
  --build-arg VITE_SUPABASE_ANON_KEY='${VITE_SUPABASE_ANON_KEY}' \
  -t ${APP_NAME}:latest .

cat > .env << ENVEOF
APP_NAME=${APP_NAME}
HOST_HTTP_PORT=${HOST_HTTP_PORT}
ENVEOF

cat > docker-compose.prod.yml << 'COMPOSEEOF'
services:
  frontend:
    image: \${APP_NAME}:latest
    container_name: \${APP_NAME}
    restart: always
    ports:
      - "\${HOST_HTTP_PORT}:80"
    networks:
      - apps-net
networks:
  apps-net:
    external: true
COMPOSEEOF

docker compose -f docker-compose.prod.yml --env-file .env up -d --force-recreate
echo "✓ JanuszLicytuje: http://${VPS_HOST}:${HOST_HTTP_PORT}"
REMOTE
