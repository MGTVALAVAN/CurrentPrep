#!/bin/bash
# ==============================================================================
# CURRENTIAS DAILY AUTOMATION SCRIPT
# This script runs the local ePaper pipeline and emails the PDF to the user.
#
# When run via launchd (com.currentias.epaper), stdout/stderr are automatically
# captured to automation_run.log and automation_error.log respectively.
# When run manually, output goes to the terminal AND is appended to the log file.
# ==============================================================================

# Ensure we are in the right directory
cd "/Users/mgtvalavan/UPSC coaching antigravity" || exit

# Load paths for Node/NPM if run via launchd/cron
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# Only attempt to use NVM if the path variable was configured inside ~/.nvm, otherwise the standard brew installation should be used
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Detect if running under launchd (stdout is already redirected to log file)
# If running manually from a terminal, tee output to the log file as well.
LOG_FILE="automation_run.log"
if [ -t 1 ]; then
    # Running interactively in a terminal — tee to log file
    exec > >(tee -a "$LOG_FILE") 2>&1
fi
# When run by launchd, stdout/stderr already go to the log files via the plist,
# so we just write to stdout normally — no double-write.

# ─────────────────────────────────────────────────────────
# FAILURE ALERT EMAIL FUNCTION
# Sends a lightweight alert email via Python (no Node/Next.js dependency)
# so that failures are NEVER silent.
# ─────────────────────────────────────────────────────────
send_failure_alert() {
    local SUBJECT="$1"
    local BODY="$2"

    # Load SMTP credentials from .env.local
    SMTP_USER=$(grep '^SMTP_USER=' .env.local 2>/dev/null | cut -d'=' -f2-)
    SMTP_PASS=$(grep '^SMTP_PASS=' .env.local 2>/dev/null | cut -d'=' -f2-)

    if [ -z "$SMTP_USER" ] || [ -z "$SMTP_PASS" ]; then
        echo "⚠️ Cannot send failure alert: SMTP credentials not found in .env.local"
        return 1
    fi

    python3 - "$SMTP_USER" "$SMTP_PASS" "$SUBJECT" "$BODY" <<'PYEOF'
import sys, smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

user, passwd, subject, body = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

msg = MIMEMultipart("alternative")
msg["From"] = f"Current IAS Prep <{user}>"
msg["To"] = user
msg["Subject"] = subject

html = f"""
<div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 0;">
  <div style="background: linear-gradient(135deg, #B91C1C, #7F1D1D); padding: 22px 28px; border-radius: 10px 10px 0 0;">
    <h2 style="color: #FEE2E2; margin: 0; font-size: 20px;">⚠️ ePaper Pipeline Alert</h2>
  </div>
  <div style="background: #FFF; border: 1px solid #E5E7EB; border-top: none; padding: 24px 28px; border-radius: 0 0 10px 10px;">
    <pre style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.6; white-space: pre-wrap; color: #991B1B;">{body}</pre>
    <p style="font-size: 13px; color: #6B7280; margin: 16px 0 0;">Check <code>automation_run.log</code> and <code>automation_error.log</code> for full details.</p>
    <p style="font-size: 12px; color: #9CA3AF; margin: 16px 0 0; border-top: 1px solid #E5E7EB; padding-top: 12px;">This alert was sent by the CurrentIAS daily automation script.</p>
  </div>
</div>
"""

msg.attach(MIMEText(html, "html"))

try:
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as srv:
        srv.login(user, passwd)
        srv.sendmail(user, [user], msg.as_string())
    print("[alert] ✅ Failure alert email sent to", user)
except Exception as e:
    print(f"[alert] ❌ Failed to send alert email: {e}")
PYEOF
}

echo "=========================================================="
echo "Starting Daily CurrentIAS Generation at $(date)"

# ─────────────────────────────────────────────────────────
# STEP 0: Start Next.js server if not already running
# ─────────────────────────────────────────────────────────
SERVER_STARTED_BY_SCRIPT=0
SERVER_UP=0

if curl -s -o /dev/null -w '' http://localhost:3000; then
    echo "Next.js server is already running on port 3000."
    SERVER_UP=1
else
    echo "Starting Next.js server in the background..."

    # Kill anything lingering on port 3000 from a previous failed run
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 1

    # Redirect server output to log with timestamp
    npx next dev > next_server.log 2>&1 &
    NEXT_PID=$!
    SERVER_STARTED_BY_SCRIPT=1

    # Wait for the server to be ready (max 90 seconds)
    echo "Waiting for Next.js server to be ready on port 3000..."
    for i in {1..45}; do
        if curl -s -o /dev/null -w '' http://localhost:3000; then
            echo "Next.js server is up (took ~$((i * 2))s)."
            SERVER_UP=1
            break
        fi
        # Check if the process actually died
        if ! kill -0 $NEXT_PID 2>/dev/null; then
            echo "❌ Next.js server process died unexpectedly!"
            echo "--- next_server.log contents ---"
            cat next_server.log 2>/dev/null
            echo "--- end of next_server.log ---"
            break
        fi
        sleep 2
    done
fi

if [ $SERVER_UP -eq 0 ]; then
    FAIL_MSG="Next.js dev server failed to start on $(date).
The pipeline cannot proceed without a running server.

Last 20 lines of next_server.log:
$(tail -20 next_server.log 2>/dev/null || echo '(empty)')

Possible causes:
  • Port 3000 was occupied by a zombie process
  • Node.js / npm modules issue (try: rm -rf .next && npm run dev)
  • Missing environment variables"

    echo "❌ FATAL: Server never came up after 90s. Aborting pipeline."
    echo "$FAIL_MSG" >> automation_error.log
    send_failure_alert "❌ ePaper Pipeline FAILED — Server Down ($(date +%Y-%m-%d))" "$FAIL_MSG"
    echo "Daily automation ABORTED at $(date)!"
    exit 1
fi

# ─────────────────────────────────────────────────────────
# STEP 1: Update Current Affairs
# ─────────────────────────────────────────────────────────
echo "[1/8] Updating Current Affairs page..."
npx tsx scripts/update-current-affairs.ts
CA_EXIT=$?
if [ $CA_EXIT -ne 0 ]; then
    echo "⚠️ Current affairs update failed — continuing with ePaper generation."
    echo "Current affairs update failed at $(date)" >> automation_error.log
fi

# Brief cooldown for AI rate limits between current affairs and ePaper generation
echo "Waiting 30 seconds before ePaper generation..."
sleep 30

# ─────────────────────────────────────────────────────────
# STEP 2: Generate ePaper
# ─────────────────────────────────────────────────────────
echo "[2/8] Scraping news and generating Master Lead & Articles..."
npx tsx scripts/generate_custom_epaper.ts
GEN_EXIT=$?

if [ $GEN_EXIT -ne 0 ]; then
    echo "❌ ePaper generation failed — check logs for details."
    echo "Generation failed at $(date)" >> automation_error.log
    # Still try to continue if partial data exists
fi

# ─────────────────────────────────────────────────────────
# STEP 3: Quick Bytes
# ─────────────────────────────────────────────────────────
echo "[3/8] Regenerating Quick Bytes with diversity-enforced prompt..."
npx tsx scripts/regenerate-quickbytes.ts
QB_EXIT=$?
if [ $QB_EXIT -ne 0 ]; then
    echo "⚠️ Quick Bytes regeneration failed — ePaper will use fallback/empty Quick Bytes."
    echo "Quick Bytes regen failed at $(date)" >> automation_error.log
fi

# ─────────────────────────────────────────────────────────
# STEP 4: Front page extras
# ─────────────────────────────────────────────────────────
echo "[4/8] Generating front page extras (Quote, On This Day, Data Snapshot)..."
npx tsx scripts/generate-front-page-extras.ts
FPE_EXIT=$?
if [ $FPE_EXIT -ne 0 ]; then
    echo "⚠️ Front page extras generation failed — ePaper will have empty extras."
    echo "Front page extras failed at $(date)" >> automation_error.log
fi

# ─────────────────────────────────────────────────────────
# STEP 5: Fact-checker
# ─────────────────────────────────────────────────────────
echo "[5/8] Running automated fact-checker against ground truth..."
npx tsx scripts/fact-check-epaper.ts
FC_EXIT=$?
if [ $FC_EXIT -ne 0 ]; then
    echo "⚠️ Fact-checker found critical issues — review fact-check output above."
    echo "Fact-check flagged issues at $(date)" >> automation_error.log
fi

# ─────────────────────────────────────────────────────────
# STEP 6: Mocks
# ─────────────────────────────────────────────────────────
echo "[6/8] Mocks already generated by AI pipeline..."

# ─────────────────────────────────────────────────────────
# STEP 7: Validation
# ─────────────────────────────────────────────────────────
echo "[7/8] Running pre-send validation checklist..."
npx tsx scripts/validate_epaper.ts
VALIDATION_EXIT=$?

if [ $VALIDATION_EXIT -ne 0 ]; then
    FAIL_MSG="Validation failed on $(date).
The ePaper did not pass quality checks. Email was NOT sent.

Step exit codes:
  Current Affairs: $CA_EXIT
  ePaper Generate: $GEN_EXIT
  Quick Bytes:     $QB_EXIT
  Front Extras:    $FPE_EXIT
  Fact-Check:      $FC_EXIT
  Validation:      $VALIDATION_EXIT"

    echo "❌ VALIDATION FAILED — Skipping email send. Check automation_error.log for details."
    echo "Validation failed at $(date)" >> automation_error.log
    send_failure_alert "⚠️ ePaper Validation FAILED — No Email Sent ($(date +%Y-%m-%d))" "$FAIL_MSG"
else
    echo "[8/8] Validation passed! Generating PDF and sending email..."
    npx tsx scripts/test-email.ts
    EMAIL_EXIT=$?
    if [ $EMAIL_EXIT -ne 0 ]; then
        FAIL_MSG="PDF generation or email sending failed on $(date).
Validation passed, but the final email step returned exit code $EMAIL_EXIT."
        echo "❌ Email send failed with exit code $EMAIL_EXIT"
        echo "Email send failed at $(date)" >> automation_error.log
        send_failure_alert "❌ ePaper Email FAILED — PDF/Send Error ($(date +%Y-%m-%d))" "$FAIL_MSG"
    fi
fi

# ─────────────────────────────────────────────────────────
# Cleanup Next.js server if we started it
# ─────────────────────────────────────────────────────────
if [ $SERVER_STARTED_BY_SCRIPT -eq 1 ]; then
    echo "Stopping Next.js server..."
    kill $NEXT_PID 2>/dev/null

    # Also explicitly kill the process listening on port 3000 just to be safe
    # If the kill above worked gracefully this is just a backup.
    sleep 2
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi

echo "Daily automation complete at $(date)!"
