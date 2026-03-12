#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$HOME/Desktop/hyperledgerassignment/medlegder-frontend"

if ! command -v bun >/dev/null 2>&1; then
  echo "Bun not found. Please install it first."
  exit 1
fi

cd "$APP_DIR"

if [ ! -f .env ]; then
  echo ".env file not found. Creating from default template..."
  cat <<EOF > .env
DATABASE_URL=file:./local.db
DATABASE_AUTH_TOKEN=
EOF
fi

echo "Ensuring dependencies are installed..."
bun install

echo "Generating and pushing database schema..."
bunx drizzle-kit generate
bunx drizzle-kit push

echo "Database migrations complete. local.db has been generated."
