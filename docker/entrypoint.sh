#!/bin/sh
set -eu

# Defaults (safe + sensible)
: "${API_HOST:=api}"
: "${API_PORT:=8081}"
: "${API_BASE:=/api}"

echo "Using API_HOST=${API_HOST}"
echo "Using API_PORT=${API_PORT}"
echo "Using API_BASE=${API_BASE}"

# ---- Write runtime JS config ----
cat > /usr/share/nginx/html/config.js <<EOF
window.__CONFIG__ = {
  API_BASE: "${API_BASE}"
};
EOF

# ---- Render nginx config ----
envsubst '${API_HOST} ${API_PORT}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "Rendered nginx config:"
cat /etc/nginx/conf.d/default.conf

exec "$@"
