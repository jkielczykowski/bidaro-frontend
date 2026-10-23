#!/usr/bin/env bash
# Run AFTER adding DNS: bidigo.memorlee.app → 72.61.177.37
set -euo pipefail

VPS_HOST="${VPS_HOST:-72.61.177.37}"
VPS_USER="${VPS_USER:-root}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/memorlee-deploy}"
DOMAIN="${DOMAIN:-bidigo.memorlee.app}"
APP_CONTAINER="${APP_CONTAINER:-bidigo-frontend}"

ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" bash -s <<EOF
set -euo pipefail

# TLS certificate
certbot certonly --webroot -w /var/www/certbot -d ${DOMAIN} --non-interactive --agree-tos -m admin@memorlee.app || {
  echo "Certbot failed — upewnij się, że DNS wskazuje na ${VPS_HOST}"
  exit 1
}

# Append HTTPS server block if missing
if ! grep -q "${DOMAIN}" /opt/apps-edge/apps-edge-nginx.conf; then
  sed -i "s/server_name memorlee.app www.memorlee.app test.memorlee.app;/server_name memorlee.app www.memorlee.app test.memorlee.app ${DOMAIN};/" /opt/apps-edge/apps-edge-nginx.conf

  cat >> /opt/apps-edge/apps-edge-nginx.conf << 'NGINXEOF'

server {
    listen 443 ssl;
    http2 on;
    server_name bidigo.memorlee.app;

    ssl_certificate     /etc/letsencrypt/live/bidigo.memorlee.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bidigo.memorlee.app/privkey.pem;

    location / {
        set \$fe ${APP_CONTAINER}:80;
        proxy_pass http://\$fe;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINXEOF

  docker exec apps-edge nginx -t
  docker exec apps-edge nginx -s reload
fi

echo "✓ https://${DOMAIN} should be live"
EOF
