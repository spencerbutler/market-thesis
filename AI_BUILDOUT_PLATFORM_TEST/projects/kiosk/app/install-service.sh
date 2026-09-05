#!/usr/bin/env bash
# Installs the thesis-dashboard systemd service + placeholder entrypoint.
# Run as root on the kiosk, from the directory containing this script:
#   sudo ./install-service.sh [--autologin]
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root (sudo ./install-service.sh)" >&2
  exit 1
fi

USERNAME="claude"
APP_DIR="/home/${USERNAME}/projects/kiosk/app"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- app directory + entrypoint ----------------------------------------------
# Guard against SCRIPT_DIR and APP_DIR being the same place (the normal case
# now that deploys land directly in ~/projects/kiosk/app) — `install` copying
# a file onto itself can truncate it. Just fix ownership/perms in place then.
mkdir -p "$APP_DIR"
if [[ "$(readlink -f "$SCRIPT_DIR/start.sh")" == "$(readlink -f "$APP_DIR/start.sh" 2>/dev/null || echo "$APP_DIR/start.sh")" ]]; then
  chown "$USERNAME:$USERNAME" "$APP_DIR/start.sh"
  chmod 755 "$APP_DIR/start.sh"
else
  install -o "$USERNAME" -g "$USERNAME" -m 755 "$SCRIPT_DIR/start.sh" "$APP_DIR/start.sh"
fi
[[ -f "$APP_DIR/.env" ]] || install -o "$USERNAME" -g "$USERNAME" -m 600 /dev/null "$APP_DIR/.env"

# --- systemd unit -------------------------------------------------------------
install -m 644 "$SCRIPT_DIR/thesis-dashboard.service" /etc/systemd/system/thesis-dashboard.service
systemctl daemon-reload
systemctl enable --now thesis-dashboard.service

echo "Service installed and started. Check with:"
echo "  systemctl status thesis-dashboard.service"

# --- keep claude's systemd user instance alive without an active login ------
loginctl enable-linger "$USERNAME"

# --- optional: auto-login claude on the physical console --------------------
if [[ "${1:-}" == "--autologin" ]]; then
  mkdir -p /etc/systemd/system/getty@tty1.service.d
  cat > /etc/systemd/system/getty@tty1.service.d/autologin.conf <<EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin ${USERNAME} --noclear %I \$TERM
EOF
  systemctl daemon-reload
  systemctl restart getty@tty1.service
  echo "Console autologin enabled for $USERNAME on tty1"
fi
