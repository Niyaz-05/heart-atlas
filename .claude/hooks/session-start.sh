#!/usr/bin/env bash
# Installs dependencies in Claude Code cloud sessions so lint and tests run right away.
# Does nothing locally, and nothing until the repository has a pnpm lockfile.
set -euo pipefail

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"
[ -f pnpm-lock.yaml ] || exit 0

corepack enable
pnpm install --frozen-lockfile
