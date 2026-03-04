#!/usr/bin/env bash
#
# Start the Next.js dev server (Turbopack).
# Run from project root: ./scripts/start-dev.sh
#
# After "Ready", open http://localhost:3000 in your browser.

set -e
cd "$(dirname "$0")/.."

echo "=== Reveal AI Web – starting dev server ==="
echo ""

# Free port 3000 if needed
if command -v lsof >/dev/null 2>&1; then
  PID=$(lsof -ti :3000 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo "Port 3000 in use (PID $PID). Freeing..."
    kill -9 $PID 2>/dev/null || true
    sleep 2
  fi
fi

echo "Starting... (wait for 'Ready' then open http://localhost:3000)"
echo ""

exec npm run dev
