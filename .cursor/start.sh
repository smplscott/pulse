#!/usr/bin/env bash
set -euo pipefail

# Dev defaults — Cloud Agent secrets override these when configured.
export NODE_ENV="${NODE_ENV:-development}"
export SESSION_SECRET="${SESSION_SECRET:-pulse-dev-secret-key}"
export CRON_SECRET="${CRON_SECRET:-pulse-dev-cron-secret}"

LOCAL_DATABASE_URL="postgresql://pulse:pulse@localhost:5432/pulse"
export DATABASE_URL="${DATABASE_URL:-$LOCAL_DATABASE_URL}"

is_local_database_url() {
  [[ "$DATABASE_URL" == *"localhost"* || "$DATABASE_URL" == *"127.0.0.1"* || "$DATABASE_URL" == *"[::1]"* ]]
}

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

  for _ in $(seq 1 30); do
    if pg_isready -h localhost -q 2>/dev/null; then
      return 0
    fi
    sleep 1
  done
  echo "PostgreSQL did not become ready on localhost:5432." >&2
  exit 1
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

# drizzle-kit push prompts on data-loss (for example connect-pg-simple's session
# table). Never run it against a remote DATABASE_URL — that hangs Cloud Agent
# install/start and can mutate shared Neon data. Local empty databases use
# --force so schema apply stays non-interactive.
if is_local_database_url; then
  npx drizzle-kit push --force
else
  echo "Skipping db:push because DATABASE_URL is remote; using the existing schema."
fi
