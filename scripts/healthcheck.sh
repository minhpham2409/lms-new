#!/bin/bash
# =============================================================================
# Health Check & Telegram Alert Script
# =============================================================================
# Description: Checks if the LMS API is responding through Nginx.
#              If it fails 3 consecutive times, sends a Telegram alert.
#
# Usage:       bash scripts/healthcheck.sh
#
# Crontab:     Run every 5 minutes:
#              */5 * * * * BOT_TOKEN=your_token CHAT_ID=your_chat_id /opt/lms-new/scripts/healthcheck.sh >> /var/log/lms-healthcheck.log 2>&1
#
# Environment:
#   BOT_TOKEN  - Telegram Bot API token (from @BotFather)
#   CHAT_ID    - Telegram chat/group ID to receive alerts
# =============================================================================

set -euo pipefail

HEALTH_URL="http://localhost/api/v1"
MAX_RETRIES=3
RETRY_DELAY=10

# Validate required environment variables
if [ -z "${BOT_TOKEN:-}" ] || [ -z "${CHAT_ID:-}" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: BOT_TOKEN and CHAT_ID must be set"
    exit 1
fi

FAILURES=0

for i in $(seq 1 ${MAX_RETRIES}); do
    if curl -sf --max-time 10 "${HEALTH_URL}" > /dev/null 2>&1; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Health check PASSED (attempt ${i})"
        exit 0
    else
        FAILURES=$((FAILURES + 1))
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Health check FAILED (attempt ${i}/${MAX_RETRIES})"
        if [ ${FAILURES} -lt ${MAX_RETRIES} ]; then
            sleep ${RETRY_DELAY}
        fi
    fi
done

# All retries failed - send Telegram alert
HOSTNAME=$(hostname)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
MESSAGE="🚨 *LMS ALERT*%0A%0AHealth check failed after ${MAX_RETRIES} attempts!%0A%0A🖥 Host: ${HOSTNAME}%0A🔗 URL: ${HEALTH_URL}%0A🕐 Time: ${TIMESTAMP}%0A%0APlease check the server immediately."

curl -sf --max-time 10 \
    "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "text=${MESSAGE}" \
    -d "parse_mode=Markdown" \
    > /dev/null 2>&1 || echo "[${TIMESTAMP}] WARNING: Failed to send Telegram alert"

echo "[${TIMESTAMP}] CRITICAL: LMS API is DOWN - Telegram alert sent"
exit 1
