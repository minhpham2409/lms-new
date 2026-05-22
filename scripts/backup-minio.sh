#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# LMS MinIO Object Storage Backup Script
#
# Usage:
#   chmod +x scripts/backup-minio.sh
#   ./scripts/backup-minio.sh
#
# Crontab (weekly on Sunday at 3:00 AM):
#   0 3 * * 0 /opt/lms-new/scripts/backup-minio.sh >> /var/log/lms-backup.log 2>&1
#
# Prerequisites:
#   Set MINIO_ROOT_USER and MINIO_ROOT_PASSWORD environment variables,
#   or export them before running.
# ─────────────────────────────────────────────────────────────────────────────

BACKUP_DIR="/opt/backups/minio"
MINIO_ALIAS="lms-minio"
MINIO_ENDPOINT="http://localhost:9000"
BUCKET="lms-assets"

echo "[$(date)] Starting MinIO backup..."

mkdir -p "${BACKUP_DIR}"

# Use MinIO Client (mc) to mirror the bucket to local filesystem
docker run --rm --network host \
    -v "${BACKUP_DIR}:/backup" \
    -e MC_HOST_${MINIO_ALIAS}="${MINIO_ENDPOINT}" \
    minio/mc mirror \
    "${MINIO_ALIAS}/${BUCKET}" \
    "/backup/${BUCKET}" \
    --overwrite

echo "[$(date)] ✅ MinIO backup completed to ${BACKUP_DIR}/${BUCKET}"
