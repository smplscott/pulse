#!/usr/bin/env bash
set -euo pipefail

npm install

if ! command -v psql >/dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib
fi

bash .cursor/start.sh
