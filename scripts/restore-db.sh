#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# LMS PostgreSQL Database Restore Script
#
# Usage:
#   chmod +x scripts/restore-db.sh
#   ./scripts/restore-db.sh /opt/backups/postgres/lms_db_20260101_020000.sql.gz
#
# ⚠️  WARNING: This will OVERWRITE the current database!
# ─────────────────────────────────────────────────────────────────────────────

CONTAINER_NAME="lms-postgres"
DB_USER="lms"
DB_NAME="lms_db"

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup-file.sql.gz>"
    echo "Example: $0 /opt/backups/postgres/lms_db_20260101_020000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ⚠️  WARNING: DATABASE RESTORE                              ║"
echo "║                                                              ║"
echo "║  This will DROP and RECREATE the database '${DB_NAME}'.      ║"
echo "║  ALL current data will be PERMANENTLY LOST.                  ║"
echo "║                                                              ║"
echo "║  Backup file: ${BACKUP_FILE}"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
read -p "Type 'YES' to confirm restore: " CONFIRM

if [ "${CONFIRM}" != "YES" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "[$(date)] Starting database restore from: ${BACKUP_FILE}"

# Drop and recreate the database
docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME};"

# Decompress and restore
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo "[$(date)] ✅ Database restored successfully from: ${BACKUP_FILE}"
echo "[$(date)] ⚠️  Run 'npx prisma migrate deploy' if needed to apply pending migrations."
