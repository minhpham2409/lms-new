#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# LMS PostgreSQL Database Backup Script
#
# Usage:
#   chmod +x scripts/backup-db.sh
#   ./scripts/backup-db.sh
#
# Crontab (daily at 2:00 AM):
#   0 2 * * * /opt/lms-new/scripts/backup-db.sh >> /var/log/lms-backup.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────

BACKUP_DIR="/opt/backups/postgres"
CONTAINER_NAME="lms-postgres"
DB_USER="lms"
DB_NAME="lms_db"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/lms_db_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting PostgreSQL backup..."

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Dump database and compress
docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"

# Verify backup was created and has content
if [ -s "${BACKUP_FILE}" ]; then
    SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "[$(date)] ✅ Backup completed: ${BACKUP_FILE} (${SIZE})"
else
    echo "[$(date)] ❌ Backup failed: file is empty or missing"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Remove old backups (older than RETENTION_DAYS)
DELETED=$(find "${BACKUP_DIR}" -name "lms_db_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
echo "[$(date)] Cleaned up ${DELETED} old backup(s) (older than ${RETENTION_DAYS} days)"
