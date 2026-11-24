#!/bin/sh
# Runs one pnpm command after a serialized `pnpm install`. Targets run
# concurrently and share the host node_modules; the mkdir lock keeps two
# installs from racing. A warm install is a ~2 s no-op.
set -eu
mkdir -p .smithers/cache
lock=.smithers/cache/pnpm-install.lock
until mkdir "$lock" 2>/dev/null; do sleep 0.2; done
trap 'rmdir "$lock" 2>/dev/null || true' EXIT INT TERM
pnpm install --frozen-lockfile --prefer-offline --reporter=silent
rmdir "$lock"
trap - EXIT INT TERM
exec pnpm "$@"
