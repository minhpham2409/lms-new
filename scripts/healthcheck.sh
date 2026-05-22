#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# LMS Health Check & Telegram Alert Script
#
# Usage:
#   chmod +x scripts/healthcheck.sh
#   ./scripts/healthcheck.sh
#
# Environment variables required:
#   TELEGRAM_BOT_TOKEN  - Telegram Bot API token
#   TELEGRAM_CHAT_ID    - Telegram chat/group ID to send alerts to
#
# Crontab (every 5 minutes):
#   */5 * * * * TELEGRAM_BOT_TOKEN=xxx TELEGRAM_CHAT_ID=yyy /opt/lms-new/scripts/healthcheck.sh >> /var/log/lms-healthcheck.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────

HEALTH_URL="http://localhost/api/v1"
MAX_RETRIES=3
RETRY_DELAY=5

BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${TELEGRAM_CHAT_ID:-}"

send_telegram_alert() {
    local message="$1"
    if [ -z "${BOT_TOKEN}" ] || [ -z "${CHAT_ID}" ]; then
        echo "[$(date)] ⚠️  Telegram not configured. Alert: ${message}"
        return
    fi

    curl -sf -X POST \
        "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
        -d "chat_id=${CHAT_ID}" \
        -d "text=${message}" \
        -d "parse_mode=HTML" \
        > /dev/null 2>&1 || true
}

# Retry logic: try MAX_RETRIES times with RETRY_DELAY between attempts
FAILURES=0
for i in $(seq 1 ${MAX_RETRIES}); do
    if curl -sf --max-time 10 "${HEALTH_URL}" > /dev/null 2>&1; then
        # Health check passed
        if [ ${FAILURES} -gt 0 ]; then
            echo "[$(date)] ✅ Health check recovered after ${FAILURES} failure(s)"
        fi
        exit 0
    else
        FAILURES=$((FAILURES + 1))
        echo "[$(date)] ⚠️  Health check failed (attempt ${i}/${MAX_RETRIES})"
        if [ ${i} -lt ${MAX_RETRIES} ]; then
            sleep ${RETRY_DELAY}
        fi
    fi
done

# All retries exhausted — send alert
HOSTNAME=$(hostname)
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
ALERT_MSG="🚨 <b>LMS Health Check FAILED</b>

<b>Host:</b> ${HOSTNAME}
<b>URL:</b> ${HEALTH_URL}
<b>Time:</b> ${TIMESTAMP}
<b>Retries:</b> ${MAX_RETRIES}/${MAX_RETRIES} failed

Please check the server immediately!"

echo "[$(date)] ❌ Health check FAILED after ${MAX_RETRIES} retries. Sending alert..."
send_telegram_alert "${ALERT_MSG}"
exit 1
