#!/bin/bash
#
# Karjat Farms — deploy script for Ubuntu.
# Run as the `ubuntu` user (no sudo): `bash deploy.sh`
#
# Prereqs (one-time):
#   - Code lives in /var/www/karjat-farms (chown'd to ubuntu:ubuntu)
#   - /var/log/karjat-farms exists and is chown'd to ubuntu:ubuntu
#   - Node 22, PM2 installed globally, sqlite3 installed (apt install sqlite3)
#   - .env exists with DATABASE_URL, AUTH_SECRET, RAZORPAY_* keys
#   - nginx proxies port 80 -> 127.0.0.1:3001

set -e   # exit on first error
set -u   # error on unset variables

PROJECT_DIR="/var/www/karjat-farms"
APP_NAME="karjat-farms"
PORT="3001"

cd "$PROJECT_DIR"

START_TS=$(date +%s)
echo ""
echo "════════════════════════════════════════"
echo "  Karjat Farms deploy — $(date)"
echo "════════════════════════════════════════"

echo ""
echo "→ [1/6] Installing dependencies (npm ci)"
npm ci

echo ""
echo "→ [2/6] Applying database migrations"
npx prisma migrate deploy

echo ""
echo "→ [3/6] Backfilling default rooms (idempotent — safe to re-run)"
npx tsx prisma/backfill-rooms.ts

echo ""
echo "→ [4/6] Building production bundle"
npm run build

echo ""
echo "→ [5/6] (Re)starting PM2"
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

echo ""
echo "→ [6/6] Sanity check (waiting 4s for app to bind)"
sleep 4

PM2_STATUS=$(pm2 jlist | node -e "
  let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
    const p=JSON.parse(d).find(x=>x.name==='$APP_NAME');
    console.log(p ? p.pm2_env.status : 'missing');
  });" 2>/dev/null || echo "unknown")

PORT_OK="no"
if ss -tlnp 2>/dev/null | grep -q ":${PORT} "; then PORT_OK="yes"; fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}/" || echo "000")

FARM_COUNT="?"
if command -v sqlite3 > /dev/null 2>&1 && [ -f prisma/karjat.db ]; then
  FARM_COUNT=$(sqlite3 prisma/karjat.db "SELECT COUNT(*) FROM Farmhouse;" 2>/dev/null || echo "?")
fi

ELAPSED=$(( $(date +%s) - START_TS ))

echo ""
echo "════════════════════════════════════════"
echo "  Deploy summary"
echo "════════════════════════════════════════"
echo "  PM2 status      : $PM2_STATUS"
echo "  Port :$PORT      : $([ "$PORT_OK" = "yes" ] && echo 'LISTENING' || echo 'NOT LISTENING')"
echo "  HTTP /          : $HTTP_CODE"
echo "  Farmhouses in DB: $FARM_COUNT"
echo "  Elapsed         : ${ELAPSED}s"
echo "════════════════════════════════════════"

if [ "$PM2_STATUS" = "online" ] && [ "$PORT_OK" = "yes" ] && [ "$HTTP_CODE" = "200" ]; then
  echo "  ✓ DEPLOYED OK at $(date)"
  echo ""
  exit 0
else
  echo "  ✗ DEPLOY HAS ISSUES — check above"
  echo ""
  echo "  Useful follow-ups:"
  echo "    pm2 logs $APP_NAME --lines 50 --nostream"
  echo "    ss -tlnp | grep $PORT"
  echo "    curl -v http://localhost:$PORT/"
  exit 1
fi
