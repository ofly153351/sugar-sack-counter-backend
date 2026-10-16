#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.production.yml"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

usage() {
  cat <<'EOF'
Usage: ./start-production.sh [options]

The backend and AI source directories are bind-mounted into their containers.

Options:
  --detach, -d       Start containers in the background.
  --down             Stop and remove this Compose stack.
  --logs             Follow backend and AI logs.
  --no-build         Do not rebuild images.
  -h, --help         Show this help.
EOF
}

COMPOSE_ARGS=()
COMMAND="up"
for arg in "$@"; do
  case "$arg" in
    --detach|-d) COMPOSE_ARGS+=(--detach) ;;
    --down) COMMAND="down" ;;
    --logs) COMMAND="logs" ;;
    --no-build) COMPOSE_ARGS+=(--no-build) ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; usage >&2; exit 1 ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required but was not found." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE" >&2
  echo "Create it with: cp env.template .env" >&2
  exit 1
fi

cd "$ROOT_DIR"

case "$COMMAND" in
  up)
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up --build "${COMPOSE_ARGS[@]}"
    ;;
  down)
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down
    ;;
  logs)
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs -f backend ai-service
    ;;
esac
