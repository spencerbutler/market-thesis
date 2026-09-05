#!/usr/bin/env bash
# ~/.claude/statusline.sh
# Visual indicator of how close the current Claude Code session is to its
# context/token limit. Claude Code pipes a JSON blob on stdin every render;
# see https://code.claude.com/docs/en/settings for the full schema.
# Requires: jq
set -euo pipefail

input="$(cat)"

ctx_pct="$(jq -r '.context_window.used_percentage // 0' <<<"$input")"
five_hr_pct="$(jq -r '.rate_limits.five_hour.used_percentage // 0' <<<"$input")"
model="$(jq -r '.model.display_name // .model.id // "claude"' <<<"$input")"
cost="$(jq -r '.cost.total_cost_usd // 0' <<<"$input")"

ctx_int="${ctx_pct%.*}"
[[ -z "$ctx_int" ]] && ctx_int=0

if (( ctx_int >= 90 )); then
  icon="🔴"; color=$'\033[1;31m'
elif (( ctx_int >= 70 )); then
  icon="🟡"; color=$'\033[1;33m'
else
  icon="🟢"; color=$'\033[1;32m'
fi
reset=$'\033[0m'

filled=$(( ctx_int / 10 ))
bar=""
for ((i = 0; i < 10; i++)); do
  if (( i < filled )); then
    bar+="█"
  else
    bar+="░"
  fi
done

printf "%s%s ctx %s %d%%%s | 5h %.0f%% | %s | \$%.3f\n" \
  "$color" "$icon" "$bar" "$ctx_int" "$reset" "$five_hr_pct" "$model" "$cost"
