#!/usr/bin/env bash
# Simple loop runner for Claude Code CLI
#
# Usage:
#   scripts/claude-loop.sh "<prompt>" [count] [delay_sec] [-- <extra claude args...>]
#
# Examples:
#   # Infinite loop, Ctrl-C to stop
#   scripts/claude-loop.sh "Say hello concisely" 0 2
#
#   # Run 5 times with 1s delay and custom model
#   scripts/claude-loop.sh "Summarize this repo" 5 1 -- --model sonnet

set -euo pipefail

if ! command -v claude >/dev/null 2>&1; then
  echo "Error: 'claude' CLI not found in PATH. Install Claude Code CLI first." >&2
  exit 127
fi

if [ $# -lt 1 ]; then
  echo "Usage: $0 \"<prompt>\" [count] [delay_sec] [-- <extra claude args...>]" >&2
  exit 64
fi

PROMPT="$1"; shift || true
COUNT="${1:-0}"; if [ $# -gt 0 ]; then shift; fi
DELAY="${1:-0}"; if [ $# -gt 0 ]; then shift; fi

# Remaining args (if any) are passed through to `claude`

run_i=0
while true; do
  run_i=$((run_i + 1))
  echo "[claude-loop] Run #${run_i}" >&2
  # Use --print (-p) to print and exit per invocation
  claude -p "$@" "$PROMPT"

  if [ "$COUNT" -gt 0 ] && [ "$run_i" -ge "$COUNT" ]; then
    break
  fi

  if [ "$DELAY" -gt 0 ]; then
    sleep "$DELAY"
  fi
done

