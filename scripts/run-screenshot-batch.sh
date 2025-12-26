#!/bin/bash
# Safe Batch Screenshot Capture Runner
#
# This script sets up the environment and runs the batch screenshot capture
#
# Usage:
#   ./scripts/run-screenshot-batch.sh --dry-run
#   ./scripts/run-screenshot-batch.sh --batch-size 30 --delay 12

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "Screenshot Batch Processor"
echo "========================================"
echo ""

# Check if .env.local exists and has required variables
if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
    echo "ERROR: .env.local not found!"
    echo "Please copy .env.local.template to .env.local and configure it."
    exit 1
fi

# Source environment variables
export $(grep -v '^#' "$PROJECT_ROOT/.env.local" | xargs)

# Check for required variables
MISSING_VARS=()

if [ -z "$DATABASE_URL" ]; then
    MISSING_VARS+=("DATABASE_URL")
fi

if [ -z "$BETTER_AUTH_SECRET" ]; then
    echo "WARNING: BETTER_AUTH_SECRET not set (using temporary value for scripts)"
    export BETTER_AUTH_SECRET="temporary-secret-for-screenshot-batch-12345678901234567890"
fi

if [ -z "$CRON_SECRET" ]; then
    echo "WARNING: CRON_SECRET not set (using temporary value for scripts)"
    export CRON_SECRET="temporary-cron-secret-12345678901234567890abcdef"
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "ERROR: Cloudflare credentials missing!"
    echo "Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env.local"
    echo ""
    echo "Get these from: https://dash.cloudflare.com/"
    echo "  1. Account ID: In the URL or right sidebar"
    echo "  2. API Token: My Profile -> API Tokens -> Create Token"
    echo "     Use template: 'Browser Rendering' or create custom with:"
    echo "       - Account: Browser Rendering Read & Write"
    exit 1
fi

# Display configuration
echo "Configuration:"
echo "  Database: $(echo $DATABASE_URL | sed 's/:[^@]*@/:***@/')"
echo "  Cloudflare Account: ${CLOUDFLARE_ACCOUNT_ID:0:8}..."
echo "  Cloudflare Token: ${CLOUDFLARE_API_TOKEN:0:8}..."
echo ""

# Check if dependencies are installed
if ! command -v pnpm &> /dev/null; then
    echo "ERROR: pnpm not found. Please install it first:"
    echo "  npm install -g pnpm"
    exit 1
fi

# Run the batch script
echo "Starting batch processing..."
echo ""

cd "$PROJECT_ROOT"
pnpm tsx scripts/safe-batch-screenshots.ts "$@"
