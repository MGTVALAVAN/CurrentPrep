#!/bin/bash
# ==============================================================================
# CURRENTIAS DAILY AUTOMATION SCRIPT
# This script runs the local ePaper pipeline and emails the PDF to the user.
# ==============================================================================

# Ensure we are in the right directory
cd "/Users/mgtvalavan/UPSC coaching antigravity" || exit

# Load paths for Node/NPM if run via cron
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin

# If you use nvm, uncomment the below lines:
# export NVM_DIR="$HOME/.nvm"
# [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

LOG_FILE="automation_run.log"
echo "==========================================================" >> $LOG_FILE
echo "Starting Daily CurrentIAS Generation at $(date)" >> $LOG_FILE

echo "[1/3] Scraping news and generating Master Lead & Articles..." | tee -a $LOG_FILE
npx tsx generate_custom_epaper.ts | tee -a $LOG_FILE

echo "[2/3] Injecting Prelims and Mains Mocks..." | tee -a $LOG_FILE
npx tsx add_mocks.ts | tee -a $LOG_FILE

echo "[3/3] Generating PDF and sending email..." | tee -a $LOG_FILE
# Note: For this step to work correctly, your Next.js server (npm run dev) must be running.
npx tsx test-email.ts | tee -a $LOG_FILE

echo "Daily automation complete!" | tee -a $LOG_FILE
