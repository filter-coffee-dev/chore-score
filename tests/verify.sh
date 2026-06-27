#!/bin/bash
# ChoreScore verification loop
# Usage: ./verify.sh
# Optional env vars: TEST_EMAIL=x@y.com TEST_PASSWORD=abc123

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR/../app"
DIST_DIR="$APP_DIR/dist"

echo "======================================"
echo "  ChoreScore — Verification Loop"
echo "======================================"

# Step 1: Build
echo ""
echo "▶ Building web export..."
cd "$APP_DIR"
npx expo export --platform web --clear --quiet 2>/dev/null || npx expo export --platform web --clear
echo "✓ Build complete"

# Step 2: Serve in background
echo ""
echo "▶ Starting server on http://localhost:3000..."
pkill -f "serve.*dist" 2>/dev/null || true
npx serve "$DIST_DIR" --listen 3000 &
SERVER_PID=$!
sleep 2
echo "✓ Server running (PID $SERVER_PID)"

# Step 3: Run tests
echo ""
echo "▶ Running Playwright tests..."
cd "$SCRIPT_DIR"
set +e
npx playwright test --config=playwright.config.js "$@"
TEST_EXIT=$?
set -e

# Step 4: Cleanup
kill $SERVER_PID 2>/dev/null || true

# Step 5: Report
echo ""
if [ $TEST_EXIT -eq 0 ]; then
  echo "✅ All tests passed"
else
  echo "❌ Some tests failed — check output above and screenshots in tests/test-results/"
fi
echo ""

exit $TEST_EXIT
