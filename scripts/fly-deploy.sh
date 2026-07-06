#!/usr/bin/env bash
set -euo pipefail

export PATH="${HOME}/.fly/bin:${PATH}"

APP_NAME="${FLY_APP_NAME:-starry-clouds}"

if [[ -z "${FLY_API_TOKEN:-}" ]]; then
  echo "Set FLY_API_TOKEN first: https://fly.io/user/personal_access_tokens"
  exit 1
fi

flyctl deploy --remote-only
echo "Live at: https://${APP_NAME}.fly.dev"
