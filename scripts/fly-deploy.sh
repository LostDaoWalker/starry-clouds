#!/usr/bin/env bash
set -euo pipefail

export PATH="${HOME}/.fly/bin:${PATH}"

APP_NAME="${FLY_APP_NAME:-starry-clouds}"
DB_NAME="${FLY_DB_NAME:-glamour-db}"
REGION="${FLY_REGION:-iad}"

if [[ -z "${FLY_API_TOKEN:-}" ]]; then
  echo "Set FLY_API_TOKEN first. Create one at https://fly.io/user/personal_access_tokens"
  exit 1
fi

if ! flyctl postgres list 2>/dev/null | grep -q "${DB_NAME}"; then
  flyctl postgres create \
    --name "${DB_NAME}" \
    --region "${REGION}" \
    --initial-cluster-size 1 \
    --vm-size shared-cpu-1x \
    --volume-size 1 \
    --yes
fi

flyctl postgres attach "${DB_NAME}" --app "${APP_NAME}" --yes || true
flyctl deploy --remote-only

echo "Live at: https://${APP_NAME}.fly.dev"
