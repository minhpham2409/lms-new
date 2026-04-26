#!/usr/bin/env bash
# Chạy API (3001) + Next (3000) trong một terminal. Ctrl+C dừng cả hai.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

free_port() {
  local port="$1"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  elif command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -ti ":${port}" 2>/dev/null || true)
    if [ -n "${pids}" ]; then
      kill -9 ${pids} 2>/dev/null || true
    fi
  fi
}

echo "Giải phóng cổng 3000 / 3001 nếu đang bận..."
free_port 3000
free_port 3001
if ! command -v fuser >/dev/null 2>&1 && ! command -v lsof >/dev/null 2>&1; then
  echo "Gợi ý: cài psmisc (fuser) hoặc lsof, hoặc tự đóng process đang dùng cổng 3000/3001."
fi
sleep 1

cleanup() {
  echo ""
  echo "Đang dừng server..."
  kill "$BACK_PID" "$FRONT_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

(cd "$ROOT/backend" && npm run start:dev) &
BACK_PID=$!
(cd "$ROOT/frontend" && npm run dev) &
FRONT_PID=$!

echo ""
echo "Backend PID: $BACK_PID  → http://localhost:3001"
echo "Frontend PID: $FRONT_PID → http://localhost:3000"
echo "Mở trình duyệt: http://localhost:3000"
echo ""

wait
