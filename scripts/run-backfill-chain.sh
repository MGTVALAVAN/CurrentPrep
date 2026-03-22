#!/bin/bash
# Chained backfill: runs months sequentially
# Skips already-generated dates automatically

export GEMINI_API_KEY=AIzaSyD1uuG-8WriK4DJmc5HATxzAOYmzWFiuwE
cd "$(dirname "$0")/.."

MONTHS=(
  "2025-12"
  "2026-01"
  "2025-09"
  "2025-08"
  "2025-07"
  "2025-06"
  "2025-05"
  "2025-04"
  "2025-03"
  "2025-02"
  "2025-01"
  "2024-12"
  "2024-11"
  "2024-10"
  "2024-09"
)

for M in "${MONTHS[@]}"; do
  echo ""
  echo "════════════════════════════════════════════════"
  echo "  Starting month: $M"
  echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "════════════════════════════════════════════════"
  npx tsx scripts/backfill-epaper.ts --month "$M" --no-gdelt
  RC=$?
  echo "  Completed: $M (exit: $RC) at $(date '+%Y-%m-%d %H:%M:%S')"
  echo "  Cooling down 60s before next month..."
  sleep 60
done

echo ""
echo "🎉 ALL MONTHS COMPLETE!"
echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
