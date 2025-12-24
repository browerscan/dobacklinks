#!/bin/bash

# Configure GitHub Repository Secrets for Cloudflare Pages Deployment
# This script uses GitHub CLI (gh) to securely configure repository variables
# Note: Sensitive values should be passed via environment variables or prompted

set -e

# Colors for output
GREEN='\033[0.32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Setting up GitHub Secrets for Cloudflare Pages${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Set repository (auto-detect from git remote)
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")

if [ -z "$REPO" ]; then
    echo -e "${YELLOW}⚠️  Could not detect repository from git remote${NC}"
    echo "Please run this script from your repository directory"
    exit 1
fi

echo "📦 Repository: $REPO"
echo ""

# Cloudflare Account ID (pass via environment variable or edit here)
CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-your-cloudflare-account-id-here}"

# Cloudflare API Token (pass via environment variable or edit here)
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-your-cloudflare-api-token-here}"

# Validate that secrets are set
if [ "$CLOUDFLARE_ACCOUNT_ID" = "your-cloudflare-account-id-here" ]; then
    echo -e "${YELLOW}⚠️  CLOUDFLARE_ACCOUNT_ID not set${NC}"
    echo "Set it via: export CLOUDFLARE_ACCOUNT_ID=your-account-id"
    exit 1
fi

if [ "$CLOUDFLARE_API_TOKEN" = "your-cloudflare-api-token-here" ]; then
    echo -e "${YELLOW}⚠️  CLOUDFLARE_API_TOKEN not set${NC}"
    echo "Set it via: export CLOUDFLARE_API_TOKEN=your-api-token"
    exit 1
fi

echo "Setting CLOUDFLARE_ACCOUNT_ID..."
echo "$CLOUDFLARE_ACCOUNT_ID" | gh secret set CLOUDFLARE_ACCOUNT_ID

echo "Setting CLOUDFLARE_API_TOKEN..."
echo "$CLOUDFLARE_API_TOKEN" | gh secret set CLOUDFLARE_API_TOKEN

echo ""
echo -e "${GREEN}✅ GitHub Secrets configured successfully!${NC}"
echo ""
echo "Configured secrets:"
gh secret list

echo ""
echo -e "${GREEN}🚀 You can now push code to trigger automatic deployment${NC}"
echo "Next steps:"
echo "  1. Push to main or deploy/** branch"
echo "  2. Check deployment: https://github.com/$REPO/actions"
echo "  3. Configure custom domain in Cloudflare Dashboard"
