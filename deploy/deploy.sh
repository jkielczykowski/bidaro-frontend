#!/usr/bin/env bash
set -euo pipefail

VPS_HOST="${VPS_HOST:-72.61.177.37}"
VPS_USER="${VPS_USER:-root}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/memorlee-deploy}"
APP_NAME="${APP_NAME:-janusz-licytuje}"
HOST_HTTP_PORT="${HOST_HTTP_PORT:-9088}"
REMOTE_DIR="/opt/${APP_NAME}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -f "${ROOT}/web/.env" ]]; then
  # shellcheck disable=SC1091
  set -a
  source "${ROOT}/web/.env"
  set +a
fi

VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-}"
VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
RESEND_API_KEY="${RESEND_API_KEY:-}"
MAIL_FROM="${MAIL_FROM:-Bidigo <onboarding@resend.dev>}"
SMSPLANET_API_TOKEN="${SMSPLANET_API_TOKEN:-}"
SMSPLANET_FROM="${SMSPLANET_FROM:-TEST}"
REINDEX_TOKEN="${REINDEX_TOKEN:-}"

if [[ -z "${VITE_SUPABASE_URL}" || -z "${VITE_SUPABASE_ANON_KEY}" ]]; then
  echo "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in web/.env"
  exit 1
fi

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY}" ]]; then
  echo "Missing SUPABASE_SERVICE_ROLE_KEY (needed for mail worker / search) — set in web/.env"
fi

if [[ -z "${RESEND_API_KEY}" ]]; then
  echo "⚠ RESEND_API_KEY not set — mail worker will mark emails skipped until you add it to web/.env"
fi

if [[ -z "${SMSPLANET_API_TOKEN}" ]]; then
  echo "⚠ SMSPLANET_API_TOKEN not set — SMS OTP will be skipped until you add it to web/.env"
fi

if [[ -z "${REINDEX_TOKEN}" ]]; then
  echo "⚠ REINDEX_TOKEN not set — search write endpoints (/index, /webhook, /reindex) will reject all calls"
fi

echo "→ Syncing files to ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}"
rsync -avz --delete \
  -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" \
  --exclude .git \
  --exclude deploy \
  --exclude assets \
  --exclude mobile \
  --exclude web/node_modules \
  --exclude web/dist \
  --exclude web/.env \
  --exclude search/node_modules \
  --exclude search/.env \
  --exclude landing \
  "${ROOT}/" \
  "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/"

echo "→ Building frontend + OpenSearch stack on VPS"
ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" bash -s <<EOF
set -euo pipefail
docker network create apps-net 2>/dev/null || true
cd ${REMOTE_DIR}

# Drop legacy Janusz search container names if present
docker rm -f janusz-search janusz-opensearch 2>/dev/null || true


docker build \
  --build-arg VITE_SUPABASE_URL='${VITE_SUPABASE_URL}' \
  --build-arg VITE_SUPABASE_ANON_KEY='${VITE_SUPABASE_ANON_KEY}' \
  -t ${APP_NAME}:latest .

# Mail worker (Resend)
if [[ -f mail/Dockerfile ]]; then
  docker build -t ${APP_NAME}-mail:latest ./mail
fi

# Search API
if [[ -f search/Dockerfile ]]; then
  docker build -t ${APP_NAME}-search:latest ./search
fi

cat > .env << ENVEOF
APP_NAME=${APP_NAME}
HOST_HTTP_PORT=${HOST_HTTP_PORT}
SUPABASE_URL=${VITE_SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-}
RESEND_API_KEY=${RESEND_API_KEY:-}
MAIL_FROM=${MAIL_FROM:-Bidigo <onboarding@resend.dev>}
SMSPLANET_API_TOKEN=${SMSPLANET_API_TOKEN:-}
SMSPLANET_FROM=${SMSPLANET_FROM:-TEST}
REINDEX_TOKEN=${REINDEX_TOKEN}
ENVEOF

cat > docker-compose.prod.yml << 'COMPOSEEOF'
services:
  frontend:
    image: \${APP_NAME}:latest
    container_name: \${APP_NAME}
    restart: always
    ports:
      - "\${HOST_HTTP_PORT}:80"
    depends_on:
      - search
    networks:
      - apps-net
  mail:
    image: \${APP_NAME}-mail:latest
    container_name: \${APP_NAME}-mail
    restart: always
    environment:
      SUPABASE_URL: \${SUPABASE_URL}
      SUPABASE_SERVICE_ROLE_KEY: \${SUPABASE_SERVICE_ROLE_KEY}
      RESEND_API_KEY: \${RESEND_API_KEY}
      MAIL_FROM: \${MAIL_FROM}
      SMSPLANET_API_TOKEN: \${SMSPLANET_API_TOKEN}
      SMSPLANET_FROM: \${SMSPLANET_FROM}
    networks:
      - apps-net
  opensearch:
    image: opensearchproject/opensearch:2.11.1
    container_name: bidigo-opensearch
    restart: always
    environment:
      - discovery.type=single-node
      - plugins.security.disabled=true
      - OPENSEARCH_JAVA_OPTS=-Xms1g -Xmx1g
      - bootstrap.memory_lock=true
      - DISABLE_INSTALL_DEMO_CONFIG=true
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    volumes:
      - bidigo-opensearch-data:/usr/share/opensearch/data
    networks:
      - apps-net
    healthcheck:
      test: ["CMD-SHELL", "curl -s http://localhost:9200/_cluster/health | grep -E '\"status\":\"(green|yellow)\"'"]
      interval: 10s
      timeout: 5s
      retries: 30
  search:
    image: \${APP_NAME}-search:latest
    container_name: bidigo-search
    restart: always
    depends_on:
      opensearch:
        condition: service_healthy
    environment:
      OPENSEARCH_NODE: http://bidigo-opensearch:9200
      OPENSEARCH_INDEX: auctions
      OPENSEARCH_CATEGORIES_INDEX: categories
      SUPABASE_URL: \${SUPABASE_URL}
      SUPABASE_SECRET_KEY: \${SUPABASE_SERVICE_ROLE_KEY}
      REINDEX_TOKEN: \${REINDEX_TOKEN}
      PORT: 3000
      SYNC_POLL_MS: 15000
    networks:
      - apps-net
networks:
  apps-net:
    external: true
volumes:
  bidigo-opensearch-data:
COMPOSEEOF

docker compose -f docker-compose.prod.yml --env-file .env up -d --force-recreate --remove-orphans

echo ""
echo "✓ Bidigo: http://${VPS_HOST}:${HOST_HTTP_PORT}"
echo "  Search API via /api/search/health"
EOF
