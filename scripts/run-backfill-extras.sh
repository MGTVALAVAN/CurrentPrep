#!/bin/bash
# Backfill missing months: Feb 2026 + any gaps
export GEMINI_API_KEY=AIzaSyD1uuG-8WriK4DJmc5HATxzAOYmzWFiuwE
cd "$(dirname "$0")/.."

MONTHS=("2026-02")

for M in "${MONTHS[@]}"; do
  echo ""
  echo "════════════════════════════════════════════════"
  echo "  Starting month: $M"
  echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "════════════════════════════════════════════════"
  npx tsx scripts/backfill-epaper.ts --month "$M" --no-gdelt
  echo "  Completed: $M at $(date '+%Y-%m-%d %H:%M:%S')"
  sleep 60
done

echo "🎉 EXTRAS COMPLETE!"
