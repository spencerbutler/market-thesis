#!/usr/bin/env bash
# Run inside WSL2 on the laptop.
# Pulls the kiosk/app scaffold from a Windows-side source folder (this
# session's Cowork outputs\kiosk\app, or wherever else you land it) into the
# WSL2 git repo working tree.
#
# Usage:
#   ./sync-win-to-wsl.sh <windows-source-path> [dest-path]
#
# <windows-source-path> can be a real Windows path ('C:\Users\...\outputs\kiosk\app')
# or an already-translated /mnt/c/... path — both are accepted.
# [dest-path] defaults to the repo layout you're using now.
set -euo pipefail

DEFAULT_DEST="$HOME/git/market-thesis/AI_BUILDOUT_PLATFORM_TEST/projects/kiosk/app"

if [[ $# -lt 1 ]]; then
  echo "Usage: $(basename "$0") <windows-source-path> [dest-path]" >&2
  echo "  e.g.: $(basename "$0") 'C:\\Users\\spenc\\...\\outputs\\kiosk\\app'" >&2
  exit 1
fi

RAW_SRC="$1"
DEST="${2:-$DEFAULT_DEST}"

# Translate a Windows path to its WSL /mnt/c/... equivalent if it looks like one.
if command -v wslpath >/dev/null 2>&1 && [[ "$RAW_SRC" == *:\\* || "$RAW_SRC" == *:/* ]]; then
  SRC="$(wslpath -u "$RAW_SRC")"
else
  SRC="$RAW_SRC"
fi

if [[ ! -d "$SRC" ]]; then
  echo "Source not found: $SRC" >&2
  exit 1
fi

mkdir -p "$DEST"
# No --delete here on purpose: this dest is your working git repo, and you
# may well have made local edits or added files since the last sync. Pass
# --mirror below if you ever want a strict, destructive mirror instead.
if [[ "${3:-}" == "--mirror" || "${2:-}" == "--mirror" ]]; then
  rsync -av --delete "$SRC/" "$DEST/"
else
  rsync -av "$SRC/" "$DEST/"
fi

echo ""
echo "Synced: $SRC -> $DEST"
echo "Review with: git -C \"$DEST\" status"
