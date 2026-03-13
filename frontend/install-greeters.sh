#!/usr/bin/env bash
set -euo pipefail

cd /app/greeters
yarn install --frozen-lockfile || yarn install