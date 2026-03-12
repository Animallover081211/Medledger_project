#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$HOME/Desktop/hyperledgerassignment/medlegder-frontend"

if ! command -v bun >/dev/null 2>&1; then
  echo "Bun not found. Install with:"
  echo "curl -fsSL https://bun.sh/install | bash"
  exit 1
fi

cd "$APP_DIR"

bunx drizzle-kit generate
bunx drizzle-kit push

echo "Database migrations complete."
