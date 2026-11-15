#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <path-to-backup.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Error: Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Error: DATABASE_URL environment variable is required" >&2
  exit 1
fi

if [[ -f "${CHECKSUM_FILE}" ]]; then
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum -c "${CHECKSUM_FILE}"
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 -c "${CHECKSUM_FILE}"
  fi
fi

gzip -dc "${BACKUP_FILE}" | psql "${DATABASE_URL}" --single-transaction --set ON_ERROR_STOP=on

psql "${DATABASE_URL}" -c "SELECT count(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'public';"

echo "Database restore completed successfully from: ${BACKUP_FILE}"

