#!/usr/bin/env bash
# Run inside WSL2 (or anywhere with ssh/rsync) on the laptop.
# Pushes the kiosk/app folder from your git repo out to the kiosk (touchy)
# over SSH/rsync, and optionally restarts the service.
set -euo pipefail

DEFAULT_SRC="$HOME/git/market-thesis/AI_BUILDOUT_PLATFORM_TEST/projects/kiosk/app"
KIOSK_HOST="${KIOSK_HOST:-10.0.0.100}"
KIOSK_USER="${KIOSK_USER:-claude}"
REMOTE_DIR="${REMOTE_DIR:-/home/claude/projects/kiosk/app}"
IDENTITY_FILE="${IDENTITY_FILE:-}"
RESTART=0
SRC="$DEFAULT_SRC"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] [src-path]

  src-path              Local repo path to sync from (default: $DEFAULT_SRC)
  -h, --host HOST       Kiosk hostname/IP (default: $KIOSK_HOST)
  -u, --user USER       Remote user (default: $KIOSK_USER)
  -r, --remote-dir DIR  Remote path (default: $REMOTE_DIR)
  -i, --identity FILE   SSH private key
      --restart          Restart thesis-dashboard.service after syncing
      --help              Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--host) KIOSK_HOST="$2"; shift 2 ;;
    -u|--user) KIOSK_USER="$2"; shift 2 ;;
    -r|--remote-dir) REMOTE_DIR="$2"; shift 2 ;;
    -i|--identity) IDENTITY_FILE="$2"; shift 2 ;;
    --restart) RESTART=1; shift ;;
    --help) usage; exit 0 ;;
    *) SRC="$1"; shift ;;
  esac
done

if [[ ! -d "$SRC" ]]; then
  echo "Source not found: $SRC" >&2
  exit 1
fi

SSH_CMD=(ssh -o BatchMode=yes)
[[ -n "$IDENTITY_FILE" ]] && SSH_CMD+=(-i "$IDENTITY_FILE")

"${SSH_CMD[@]}" "${KIOSK_USER}@${KIOSK_HOST}" "mkdir -p '$REMOTE_DIR'"

# --delete is safe/intended here: the kiosk copy is a deploy target, not
# somewhere you hand-edit, so it should be an exact mirror of the repo.
rsync -av --delete -e "${SSH_CMD[*]}" \
  --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
  "$SRC/" "${KIOSK_USER}@${KIOSK_HOST}:${REMOTE_DIR}/"

echo "Synced $SRC -> ${KIOSK_USER}@${KIOSK_HOST}:${REMOTE_DIR}"

if [[ "$RESTART" -eq 1 ]]; then
  "${SSH_CMD[@]}" "${KIOSK_USER}@${KIOSK_HOST}" "sudo systemctl restart thesis-dashboard.service"
  echo "Restarted thesis-dashboard.service"
fi
