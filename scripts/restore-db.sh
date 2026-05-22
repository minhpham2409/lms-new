#!/bin/bash
# =============================================================================
# PostgreSQL Database Restore Script
# =============================================================================
# Usage:       bash scripts/restore-db.sh /opt/backups/postgres/lms_db_YYYYMMDD.sql.gz
#
# Crontab:     This script is NOT meant to be automated. Run manually only.
#
# WARNING: This will DROP and RECREATE the entire database!
# =============================================================================

set -euo pipefail

CONTAINER_NAME="lms-postgres"
DB_USER="lms"
DB_NAME="lms_db"

if [ $# -ne 1 ]; then
    echo "Usage: $0 <path-to-backup.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERROR: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

if [[ "${BACKUP_FILE}" != *.sql.gz ]]; then
    echo "ERROR: Expected a .sql.gz file"
    exit 1
fi

echo "=============================================="
echo "WARNING: DATABASE RESTORE"
echo "=============================================="
echo "This will REPLACE '${DB_NAME}' with: ${BACKUP_FILE}"
echo "ALL CURRENT DATA WILL BE LOST!"
echo "=============================================="
read -p "Type 'YES' to confirm: " CONFIRM

if [ "${CONFIRM}" != "YES" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting restore..."

docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restoring from backup..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restore completed successfully!"
