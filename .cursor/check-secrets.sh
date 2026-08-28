#!/usr/bin/env bash
set -euo pipefail

required=(
  DATABASE_URL
  SESSION_SECRET
  CRON_SECRET
  SPOTIFY_CLIENT_ID
  SPOTIFY_CLIENT_SECRET
  TICKETMASTER_API_KEY
)

optional=(
  SETLISTFM_API_KEY
)

missing_required=0
missing_optional=0

echo "Pulse environment secrets"
echo "========================="

for name in "${required[@]}"; do
  if [[ -n "${!name:-}" ]]; then
    echo "✓ $name"
  else
    echo "✗ $name (required)"
    missing_required=$((missing_required + 1))
  fi
done

echo
echo "API keys (optional for boot; SETLISTFM is fallback for past shows)"
for name in "${optional[@]}"; do
  if [[ -n "${!name:-}" ]]; then
    echo "✓ $name"
  else
    echo "○ $name (not set)"
    missing_optional=$((missing_optional + 1))
  fi
done

echo
if [[ $missing_required -gt 0 ]]; then
  echo "Missing $missing_required required secret(s)."
  exit 1
fi

if [[ $missing_optional -gt 0 ]]; then
  echo "$missing_optional optional API key(s) not set — add them in Cursor Cloud Agents → Secrets."
fi

echo "Required secrets are present."
