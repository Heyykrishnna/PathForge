#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date -u +%Y%m%d_%H%M%SZ)"
TARGET_FILE="${BACKUP_DIR}/pathforge_backup_${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="${TARGET_FILE}.sha256"

mkdir -p "${BACKUP_DIR}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Error: DATABASE_URL environment variable is required" >&2
  exit 1
fi

pg_dump "${DATABASE_URL}" --no-owner --no-acl --clean --if-exists | gzip > "${TARGET_FILE}"

if [[ ! -s "${TARGET_FILE}" ]]; then
  echo "Error: Backup file was not created or is empty" >&2
  rm -f "${TARGET_FILE}"
  exit 1
fi

if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "${TARGET_FILE}" > "${CHECKSUM_FILE}"
elif command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "${TARGET_FILE}" > "${CHECKSUM_FILE}"
fi

echo "Backup completed: ${TARGET_FILE}"
if [[ -f "${CHECKSUM_FILE}" ]]; then
  cat "${CHECKSUM_FILE}"
fi

