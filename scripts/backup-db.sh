#!/bin/bash
# =============================================================================
# PostgreSQL Database Backup Script
# =============================================================================
# Description: Dumps the LMS PostgreSQL database from the Docker container,
#              compresses it with gzip, and stores it in /opt/backups/postgres/.
#              Automatically removes backups older than 7 days.
#
# Usage:       bash scripts/backup-db.sh
#
# Crontab:     Add the following line to run daily at 2:00 AM:
#              0 2 * * * /opt/lms-new/scripts/backup-db.sh >> /var/log/lms-backup-db.log 2>&1
#
# Requirements:
#   - Docker must be running with container 'lms-postgres' active
#   - /opt/backups/postgres/ directory must exist (script creates it if not)
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/backups/postgres"
CONTAINER_NAME="lms-postgres"
DB_USER="lms"
DB_NAME="lms_db"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/lms_db_${TIMESTAMP}.sql.gz"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting PostgreSQL backup..."
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Target: ${BACKUP_FILE}"

# Dump database from Docker container and compress
docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"

# Verify backup was created and is not empty
if [ -s "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completed successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Backup file is empty or was not created!"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Remove backups older than retention period
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaning up backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "lms_db_*.sql.gz" -mtime +${RETENTION_DAYS} -print -delete | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Removed ${DELETED_COUNT} old backup(s)"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup process finished."
