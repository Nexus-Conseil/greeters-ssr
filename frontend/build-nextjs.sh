#!/usr/bin/env bash
set -euo pipefail

bash /app/frontend/install-greeters.sh
cd /app/greeters
exec yarn build