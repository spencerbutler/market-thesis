#!/usr/bin/env bash
# ssh-kiosk.sh — connect to the kiosk, with OAuth-callback port forwarding
# baked in. Run from your laptop. Safe to use as your everyday connection
# script, not just for the one-time `claude` login.
set -euo pipefail

# --- defaults, override with flags or env vars ------------------------------
KIOSK_HOST="${KIOSK_HOST:-10.0.0.100}"   # kiosk is also known as "touchy" on the LAN;
                                          # pass --host touchy.local if mDNS/avahi resolves it,
                                          # or add a /etc/hosts entry mapping touchy -> 10.0.0.100
KIOSK_USER="${KIOSK_USER:-claude}"
FORWARD_PORT="${FORWARD_PORT:-8080}"     # match whatever port the `claude` login URL prints,
                                          # if it's not 8080
IDENTITY_FILE="${IDENTITY_FILE:-}"
RUN_LOGIN=0
EXTRA_ARGS=()

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] [-- ssh-args...]

  -h, --host HOST       Kiosk hostname or IP (default: $KIOSK_HOST)
  -u, --user USER       Remote user (default: $KIOSK_USER)
  -p, --port PORT       Local+remote port to forward, for the OAuth callback
                         (default: $FORWARD_PORT)
  -i, --identity FILE   SSH private key to use
      --login           Run 'claude' immediately instead of dropping to a shell
      --help             Show this help

Examples:
  $(basename "$0")                          # plain shell on the kiosk, tunnel ready
  $(basename "$0") --login                  # jump straight into 'claude' (first-time OAuth)
  $(basename "$0") --host touchy.local -p 8765
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--host) KIOSK_HOST="$2"; shift 2 ;;
    -u|--user) KIOSK_USER="$2"; shift 2 ;;
    -p|--port) FORWARD_PORT="$2"; shift 2 ;;
    -i|--identity) IDENTITY_FILE="$2"; shift 2 ;;
    --login) RUN_LOGIN=1; shift ;;
    --help) usage; exit 0 ;;
    --) shift; EXTRA_ARGS+=("$@"); break ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

SSH_OPTS=(-L "${FORWARD_PORT}:localhost:${FORWARD_PORT}")
[[ -n "$IDENTITY_FILE" ]] && SSH_OPTS+=(-i "$IDENTITY_FILE")

if [[ "$RUN_LOGIN" -eq 1 ]]; then
  exec ssh "${SSH_OPTS[@]}" "${EXTRA_ARGS[@]}" -t "${KIOSK_USER}@${KIOSK_HOST}" "claude"
else
  exec ssh "${SSH_OPTS[@]}" "${EXTRA_ARGS[@]}" "${KIOSK_USER}@${KIOSK_HOST}"
fi
