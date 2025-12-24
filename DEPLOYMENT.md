# Cloudflare Pages Deployment Guide

## Prerequisites

- Cloudflare Account ID
- Cloudflare API Token with Workers and Pages permissions
- GitHub repository (this project)

## Required GitHub Secrets

Configure these in: **Repository Settings → Secrets and variables → Actions → New repository secret**

| Secret Name             | Description                              | Example                            |
| ----------------------- | ---------------------------------------- | ---------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID               | `9cb8d6ec0f6094cf4f0cd6b3ee5a17a3` |
| `CLOUDFLARE_API_TOKEN`  | API Token with Workers/Pages permissions | `xxxx_xxxxx...`                    |
| `DATABASE_URL`          | PostgreSQL connection string             | `postgresql://...`                 |
| `BETTER_AUTH_SECRET`    | Auth secret (generate with openssl)      | `base64_string`                    |
| `SIMILARWEB_API_URL`    | SimilarWeb API endpoint                  | `https://...`                      |
| `SIMILARWEB_API_KEY`    | SimilarWeb API key                       | `pk_...`                           |
| `CRON_SECRET`           | Cron job secret (generate with openssl)  | `hex_string`                       |
| `NEXT_PUBLIC_SITE_URL`  | Production site URL                      | `https://dobacklinks.com`          |

### Optional Secrets (for OAuth, Email, etc.)

| Secret Name                        | Description               |
| ---------------------------------- | ------------------------- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`     | Google OAuth client ID    |
| `GOOGLE_CLIENT_SECRET`             | Google OAuth secret       |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID`     | GitHub OAuth client ID    |
| `GITHUB_CLIENT_SECRET`             | GitHub OAuth secret       |
| `RESEND_API_KEY`                   | Resend email API key      |
| `ADMIN_EMAIL`                      | Admin email address       |
| `CLOUDFLARE_BROWSER_RENDERING_URL` | Browser Rendering API URL |

## Getting Your Cloudflare Credentials

### 1. Account ID

Go to: https://dash.cloudflare.com → Click any domain → **Account ID** is in the right sidebar

Or use API:

```bash
curl "https://api.cloudflare.com/client/v4/accounts" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### 2. API Token

Go to: https://dash.cloudflare.com/profile/api-tokens → **Create Token**

Required permissions:

- **Account** - Cloudflare Pages: Edit
- **Account** - Workers Scripts: Edit
- **Zone** - Zone: Read (if using custom domain)

## Local Deployment with Wrangler

### Setup

1. Copy the example config:

```bash
cp wrangler.toml.example wrangler.toml
```

2. Set your account ID:

```bash
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
```

Or add to `wrangler.toml` (NOT recommended for committed code):

```toml
account_id = "your-account-id"
```

### Deploy

```bash
# Build
pnpm cloudflare:build

# Deploy
wrangler pages deploy .worker-next --project-name=dobacklinks
```

### Set Environment Variables (Optional)

You can set secrets in Cloudflare Dashboard:
https://dash.cloudflare.com → Pages → dobacklinks → Settings → Environment variables

Or use CLI:

```bash
echo "secret_value" | wrangler secret put SECRET_NAME
```

## GitHub Actions Auto-Deployment

Once secrets are configured, deployment is automatic on push to `main` branch.

**Manual trigger:**

1. Go to: Actions → Deploy to Cloudflare Pages
2. Click "Run workflow"
3. Select branch and click "Run workflow"

## Security Best Practices

1. ✅ Never commit `wrangler.toml` with `account_id` - it's in `.gitignore`
2. ✅ Use `wrangler.toml.example` as template only
3. ✅ All secrets in GitHub Secrets (never in code)
4. ✅ Rotate API tokens regularly
5. ✅ Use minimum required permissions for API tokens

## Troubleshooting

### Build fails with "account_id not found"

Make sure `CLOUDFLARE_ACCOUNT_ID` is set in GitHub Secrets.

### Deploy succeeds but site doesn't work

Check environment variables in Cloudflare Dashboard:

- Pages → dobacklinks → Settings → Environment variables

### "next-mdx-remote-client" error

Blog posts with MDX syntax errors are set to `draft` status. Fix MDX syntax or keep as draft.

## Clean Up: Remove Token from Git Remote

If you accidentally added token to remote URL:

```bash
git remote set-url origin https://github.com/browerscan/dobacklinks.git
```
