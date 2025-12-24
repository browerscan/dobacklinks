# GitHub Actions Workflows

## deploy.yml - Cloudflare Pages Deployment

Automatically deploys the application to Cloudflare Pages on every push to `main` or `deploy/**` branches.

### Required Secrets

Configure these in GitHub Repository Settings → Secrets and variables → Actions:

1. **CLOUDFLARE_API_TOKEN**
   - Obtain from: Cloudflare Dashboard → My Profile → API Tokens
   - Permissions needed: Cloudflare Pages (Edit)
   - Used for: Cloudflare API authentication

2. **CLOUDFLARE_ACCOUNT_ID**
   - Find in: Cloudflare Dashboard → Workers & Pages → Overview
   - Format: 32-character hexadecimal string
   - Used for: Identifying the Cloudflare account

### Manual Deployment

You can trigger a manual deployment from GitHub Actions → Deploy to Cloudflare Pages → Run workflow

### Environment Variables

Production environment variables are configured in Cloudflare Dashboard:

- Go to: Cloudflare Dashboard → Pages → dobacklinks → Settings → Environment Variables
- Add all required env vars from `.env.local.template`

### Security Notes

- API tokens are stored as GitHub Secrets and never exposed in logs
- The workflow has minimal permissions (`contents: read, deployments: write`)
- Tokens are not committed to the repository
