# Database Backup and Restore Runbook

Operational guide for backing up, verifying, and restoring the PathForge PostgreSQL production database.

---

## 1. Backup Strategy

- **Schedule**: Full database snapshot taken every 24 hours at 02:00 UTC.
- **Retention Policy**:
  - Daily backups: Retained for 14 days.
  - Weekly backups: Retained for 8 weeks.
  - Monthly archives: Retained for 12 months in cold object storage.
- **Format**: Compressed SQL dump (`.sql.gz`) with SHA-256 checksum verification.
- **Encryption & Isolation**: Stored in an encrypted private object storage bucket (e.g. AWS S3 with KMS or Google Cloud Storage with customer-managed keys) with strict least-privilege IAM policies.

---

## 2. Performing a Manual Backup

Run the automated backup script from the project root:

```bash
export DATABASE_URL="postgresql://user:password@hostname:5432/pathforge_prod?sslmode=require"
./scripts/db-backup.sh
```

To specify a custom backup directory:

```bash
BACKUP_DIR="/secure/backups" ./scripts/db-backup.sh
```

### Artifacts Generated

1. `backups/pathforge_backup_<TIMESTAMP>.sql.gz`: Gzip-compressed clean database dump.
2. `backups/pathforge_backup_<TIMESTAMP>.sql.gz.sha256`: SHA-256 checksum file.

---

## 3. Automated Backup Cron Configuration

Example production systemd timer or cron job (`/etc/cron.d/pathforge-db-backup`):

```bash
0 2 * * * pathforge /opt/pathforge/scripts/db-backup.sh >> /var/log/pathforge/db-backup.log 2>&1
```

---

## 4. Restoring from Backup

Before executing a restore, confirm target database credentials and stop application traffic to prevent race conditions during transaction replay.

```bash
export DATABASE_URL="postgresql://user:password@hostname:5432/pathforge_prod?sslmode=require"
./scripts/db-restore.sh ./backups/pathforge_backup_YYYYMMDD_HHMMSSZ.sql.gz
```

### Restore Safety Protections

1. **Integrity Verification**: Verifies SHA-256 checksum prior to decompression.
2. **Atomic Transaction**: Executes inside `--single-transaction` with `ON_ERROR_STOP=on`. If any statement fails, the entire transaction rolls back cleanly.
3. **Post-Restore Health Check**: Automatically verifies table count and connectivity before completing.

---

## 5. Disaster Recovery Verification & Drills

1. Perform monthly restore drills into an isolated staging schema or test instance.
2. Run database migration tests:
   ```bash
   pnpm --filter @pathforge/api test tests/migrations.test.js
   ```
3. Execute end-to-end smoke test against the restored database:
   ```bash
   pnpm --filter @pathforge/api test tests/e2e-smoke.test.js
   ```

