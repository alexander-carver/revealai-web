#!/usr/bin/env bash
#
# Start the Next.js dev server for local preview.
# Use this when Cursor's Simple Browser gives Error -102 (connection refused).
#
# After running: open http://localhost:3000 in Chrome or Safari (not Cursor browser).

set -e
cd "$(dirname "$0")/.."

echo "=== Reveal AI Web – dev preview ==="
echo ""

# Free port 3000 if something is on it
if command -v lsof >/dev/null 2>&1; then
  PID=$(lsof -ti :3000 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo "Port 3000 in use (PID $PID). Killing it..."
    kill -9 $PID 2>/dev/null || true
    sleep 1
  fi
fi

echo "Starting dev server..."
echo "When you see 'Ready', open http://localhost:3000 in Chrome or Safari."
echo "(Cursor Simple Browser often gives Error -102; use an external browser.)"
echo ""

exec npm run dev
