#!/bin/bash
# ==============================================================================
# CURRENTIAS DAILY AUTOMATION SCRIPT
# This script runs the local ePaper pipeline and emails the PDF to the user.
# ==============================================================================

# Ensure we are in the right directory
cd "/Users/mgtvalavan/UPSC coaching antigravity" || exit

# Load paths for Node/NPM if run via launchd/cron
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# Only attempt to use NVM if the path variable was configured inside ~/.nvm, otherwise the standard brew installation should be used
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

LOG_FILE="automation_run.log"
echo "==========================================================" >> $LOG_FILE
echo "Starting Daily CurrentIAS Generation at $(date)" >> $LOG_FILE

# Check if Next.js server is running
SERVER_STARTED_BY_SCRIPT=0
if curl -s -o /dev/null http://localhost:3000; then
    echo "Next.js server is already running on port 3000." | tee -a $LOG_FILE
else
    echo "Starting Next.js server in the background..." | tee -a $LOG_FILE
    # Using npx next dev directly helps avoid npm child process lingering issues
    npx next dev > next_server.log 2>&1 &
    NEXT_PID=$!
    SERVER_STARTED_BY_SCRIPT=1
    
    # Wait for the server to be ready
    echo "Waiting for Next.js server to be ready on port 3000..." | tee -a $LOG_FILE
    for i in {1..30}; do
        if curl -s -o /dev/null http://localhost:3000; then
            echo "Next.js server is up." | tee -a $LOG_FILE
            break
        fi
        sleep 2
    done
fi

echo "[1/3] Scraping news and generating Master Lead & Articles..." | tee -a $LOG_FILE
npx tsx generate_custom_epaper.ts | tee -a $LOG_FILE

echo "[2/3] Injecting Prelims and Mains Mocks..." | tee -a $LOG_FILE
npx tsx add_mocks.ts | tee -a $LOG_FILE

echo "[3/3] Generating PDF and sending email..." | tee -a $LOG_FILE
npx tsx test-email.ts | tee -a $LOG_FILE

# Cleanup Next.js server if we started it
if [ $SERVER_STARTED_BY_SCRIPT -eq 1 ]; then
    echo "Stopping Next.js server..." | tee -a $LOG_FILE
    kill $NEXT_PID 2>/dev/null
    
    # Also explicitly kill the process listening on port 3000 just to be safe
    # If the kill above worked gracefully this is just a backup.
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi

echo "Daily automation complete at $(date)!" | tee -a $LOG_FILE
