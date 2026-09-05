#!/usr/bin/env bash
# Entrypoint for the thesis dashboard. Keeping ALL logic here (not in the
# systemd unit) means this file becomes the Docker ENTRYPOINT/CMD almost
# unchanged when we containerize.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "$(date -Iseconds) thesis-dashboard starting as $(whoami)"

# First run (or after a dependency change) needs an install. Cheap no-op
# otherwise once node_modules exists.
if [[ ! -d node_modules ]]; then
  npm install
fi

npm run build
exec npx --yes serve -s dist -l "${PORT:-3000}"
