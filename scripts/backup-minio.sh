#!/bin/bash
# =============================================================================
# MinIO Object Storage Backup Script
# =============================================================================
# Description: Mirrors the entire lms-assets bucket from MinIO to a local
#              backup directory using the MinIO Client (mc) Docker image.
#
# Usage:       bash scripts/backup-minio.sh
#
# Crontab:     Add the following line to run daily at 3:00 AM:
#              0 3 * * * /opt/lms-new/scripts/backup-minio.sh >> /var/log/lms-backup-minio.log 2>&1
#
# Requirements:
#   - Docker must be running
#   - MinIO container 'lms-minio' must be accessible
#   - Environment variables MINIO_ROOT_USER and MINIO_ROOT_PASSWORD must be set
#     or hardcode them in the script configuration below
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/backups/minio"
MINIO_ALIAS="lms-minio"
MINIO_ENDPOINT="http://lms-minio:9000"
MINIO_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_PASS="${MINIO_ROOT_PASSWORD:-minioadmin}"
BUCKET_NAME="lms-assets"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting MinIO backup..."
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Mirroring bucket '${BUCKET_NAME}' to ${BACKUP_DIR}/"

# Use MinIO Client Docker image to mirror the bucket
# --network host allows the mc container to reach the MinIO container
docker run --rm \
    --network lms-new_default \
    -v "${BACKUP_DIR}:/backup" \
    minio/mc \
    sh -c "
        mc alias set ${MINIO_ALIAS} ${MINIO_ENDPOINT} ${MINIO_USER} ${MINIO_PASS} && \
        mc mirror --overwrite ${MINIO_ALIAS}/${BUCKET_NAME} /backup/${BUCKET_NAME}
    "

echo "[$(date '+%Y-%m-%d %H:%M:%S')] MinIO backup completed successfully."
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup location: ${BACKUP_DIR}/${BUCKET_NAME}/"
