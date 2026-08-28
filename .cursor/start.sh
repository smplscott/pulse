#!/usr/bin/env bash
set -euo pipefail

# Dev defaults — Cloud Agent secrets override these when configured.
export NODE_ENV="${NODE_ENV:-development}"
export DATABASE_URL="${DATABASE_URL:-postgresql://pulse:pulse@localhost:5432/pulse}"
export SESSION_SECRET="${SESSION_SECRET:-pulse-dev-secret-key}"
export CRON_SECRET="${CRON_SECRET:-pulse-dev-cron-secret}"

start_postgres() {
  if pg_isready -h localhost -q 2>/dev/null; then
    return 0
  fi
  if command -v pg_ctlcluster >/dev/null 2>&1; then
    sudo pg_ctlcluster 16 main start || sudo service postgresql start
  elif command -v service >/dev/null 2>&1; then
    sudo service postgresql start
  else
    echo "PostgreSQL is not installed. Run .cursor/install.sh first." >&2
    exit 1
  fi
  pg_isready -h localhost
}

ensure_db() {
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'pulse'" | grep -q 1 \
    || sudo -u postgres createdb pulse
  sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pulse') THEN CREATE ROLE pulse LOGIN PASSWORD 'pulse'; END IF; END \$\$;" >/dev/null
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pulse TO pulse;" >/dev/null
  sudo -u postgres psql -d pulse -c "GRANT ALL ON SCHEMA public TO pulse;" >/dev/null
}

start_postgres
ensure_db
npm run db:push
