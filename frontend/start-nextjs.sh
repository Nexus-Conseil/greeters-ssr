#!/usr/bin/env bash
set -euo pipefail

if [ ! -f /app/greeters/.next/BUILD_ID ]; then
  bash /app/frontend/build-nextjs.sh
fi

cd /app/greeters
exec yarn start --hostname 0.0.0.0 --port 3000