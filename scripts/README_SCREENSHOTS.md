# Screenshot Processing Scripts

Overview of all screenshot-related scripts and their usage.

## Quick Reference

### For Processing 283 Pending Screenshots

**Start here:** `../SCREENSHOT_QUICKSTART.md`

```bash
# 1. Setup (one-time)
./scripts/setup-env-for-screenshots.sh

# 2. Execute batch
./scripts/run-screenshot-batch.sh --batch-size 30 --delay 12

# 3. Monitor (optional)
pnpm tsx scripts/monitor-screenshot-progress.ts
```

## Main Scripts (Newly Created)

### Production Ready

| Script                           | Purpose                                  | Command                                                                 |
| -------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `safe-batch-screenshots.ts`      | Safe batch processing with rate limiting | `pnpm tsx scripts/safe-batch-screenshots.ts --batch-size 30 --delay 12` |
| `monitor-screenshot-progress.ts` | Real-time progress monitoring            | `pnpm tsx scripts/monitor-screenshot-progress.ts --interval 30`         |
| `quick-screenshot-status.ts`     | Quick status check                       | `pnpm tsx scripts/quick-screenshot-status.ts`                           |
| `setup-env-for-screenshots.sh`   | Interactive environment setup            | `./scripts/setup-env-for-screenshots.sh`                                |
| `run-screenshot-batch.sh`        | Wrapper with env validation              | `./scripts/run-screenshot-batch.sh --batch-size 30 --delay 12`          |

### Features

- **Rate Limiting**: 12-minute delays between batches
- **Failure Monitoring**: Auto-stop if >30% fail
- **Progress Tracking**: Batch-by-batch stats
- **Atomic Locking**: No duplicate processing
- **Detailed Reports**: JSON output on completion

## Legacy Scripts (Reference)

### Existing Scripts

| Script                          | Status     | Notes                                   |
| ------------------------------- | ---------- | --------------------------------------- |
| `batch-capture-screenshots.ts`  | Legacy     | Use `safe-batch-screenshots.ts` instead |
| `batch-capture-screenshots.js`  | Deprecated | Old JavaScript version                  |
| `retry-failed-screenshots.ts`   | Utility    | Reset failed to pending                 |
| `check-screenshot-status.ts`    | Utility    | Basic status check                      |
| `run-batch-screenshots-loop.sh` | Legacy     | Old loop-based approach                 |
| `run-screenshots-loop.sh`       | Deprecated | Very old version                        |

### Upload Scripts (Not Needed Currently)

Screenshots are stored locally. R2 upload scripts exist but are not required:

- `upload-screenshots-r2.py`
- `upload-screenshots-r2.sh`
- `upload-screenshots.py`
- `upload-missing-screenshots.py`
- `upload-screenshots-remote.py`
- `retry-upload-screenshots.py`

## Usage Workflows

### Workflow 1: First-Time Setup

```bash
# 1. Get Cloudflare credentials
# Visit: https://dash.cloudflare.com/
# - Note Account ID
# - Create API Token (Browser Rendering)

# 2. Run setup wizard
./scripts/setup-env-for-screenshots.sh

# 3. Verify configuration
pnpm tsx scripts/quick-screenshot-status.ts

# 4. Test with dry run
./scripts/run-screenshot-batch.sh --dry-run

# 5. Start processing
./scripts/run-screenshot-batch.sh --batch-size 30 --delay 12
```

### Workflow 2: Check Status

```bash
# Quick status
pnpm tsx scripts/quick-screenshot-status.ts

# Database query
PGPASSWORD=postgres psql -h 93.127.133.204 -p 54322 -U postgres -d postgres -c "
SELECT screenshot_status, COUNT(*)
FROM products
GROUP BY screenshot_status;
"
```

### Workflow 3: Process Pending

```bash
# Recommended settings (balanced)
./scripts/run-screenshot-batch.sh --batch-size 30 --delay 12

# Conservative settings (safer)
./scripts/run-screenshot-batch.sh --batch-size 20 --delay 15

# Aggressive settings (faster)
./scripts/run-screenshot-batch.sh --batch-size 50 --delay 8
```

### Workflow 4: Monitor Progress

```bash
# Terminal 1: Run batch
./scripts/run-screenshot-batch.sh --batch-size 30 --delay 12

# Terminal 2: Monitor
pnpm tsx scripts/monitor-screenshot-progress.ts --interval 30
```

### Workflow 5: Handle Failures

```bash
# Check failed products
pnpm tsx scripts/quick-screenshot-status.ts

# SQL query for details
PGPASSWORD=postgres psql -h 93.127.133.204 -p 54322 -U postgres -d postgres -c "
SELECT name, url, screenshot_error
FROM products
WHERE screenshot_status = 'failed'
ORDER BY updated_at DESC
LIMIT 20;
"

# Reset failures (if needed)
pnpm tsx scripts/retry-failed-screenshots.ts
```

## Script Details

### safe-batch-screenshots.ts

**Main batch processor with safety features.**

**Parameters:**

- `--batch-size N` - Products per batch (default: 30)
- `--delay M` - Minutes between batches (default: 12)
- `--max-failure-rate R` - Max failure rate before stop (default: 0.3)
- `--dry-run` - Preview only, no execution

**Example:**

```bash
pnpm tsx scripts/safe-batch-screenshots.ts --batch-size 30 --delay 12 --max-failure-rate 0.3
```

**Output:**

- Console progress updates
- JSON report: `screenshot-batch-report-{timestamp}.json`

### monitor-screenshot-progress.ts

**Real-time monitoring dashboard.**

**Parameters:**

- `--interval N` - Update interval in seconds (default: 60)

**Example:**

```bash
pnpm tsx scripts/monitor-screenshot-progress.ts --interval 30
```

**Displays:**

- Live progress bar
- Status breakdown
- Capture velocity
- ETA to completion
- Success rate

### quick-screenshot-status.ts

**Quick status snapshot.**

**Example:**

```bash
pnpm tsx scripts/quick-screenshot-status.ts
```

**Output:**

```
Status Distribution:
  Total Products:    9167
  Pending:            283 (3%)
  Captured:          8433 (92%)
  Failed:             451 (5%)

Overall Progress:
  [██████████████████████████████████████████████    ] 96.9%
  8884 / 9167 processed
```

### setup-env-for-screenshots.sh

**Interactive environment configuration.**

**Example:**

```bash
./scripts/setup-env-for-screenshots.sh
```

**Prompts for:**

- Cloudflare Account ID
- Cloudflare API Token

**Generates:**

- `.env.local` with required variables
- Secure auth secrets
- Database configuration

### run-screenshot-batch.sh

**Wrapper script with environment validation.**

**Example:**

```bash
./scripts/run-screenshot-batch.sh --batch-size 30 --delay 12
```

**Validates:**

- `.env.local` exists
- Required variables set
- Cloudflare credentials present

**Then runs:**

- `safe-batch-screenshots.ts` with arguments

## Environment Variables

### Required

```bash
DATABASE_URL                 # VPS Supabase connection
CLOUDFLARE_ACCOUNT_ID       # Cloudflare account ID
CLOUDFLARE_API_TOKEN        # API token with Browser Rendering
BETTER_AUTH_SECRET          # Auth secret (32+ chars)
CRON_SECRET                 # Cron secret (64+ chars)
```

### Optional (with defaults)

```bash
SCREENSHOT_BATCH_SIZE=8
SCREENSHOT_MAX_PROCESSING_TIME_MS=55000
SCREENSHOT_DELAY_BETWEEN_BATCHES_MS=800
SCREENSHOT_STAGGER_DELAY_MS=100
SCREENSHOT_VIEWPORT_WIDTH=1920
SCREENSHOT_VIEWPORT_HEIGHT=1080
SCREENSHOT_THUMBNAIL_WIDTH=400
SCREENSHOT_THUMBNAIL_HEIGHT=300
SCREENSHOT_FORMAT=webp
SCREENSHOT_QUALITY=80
```

## Documentation

### User Guides

- **`SCREENSHOT_QUICKSTART.md`** - Fast track guide (5 min)
- **`SCREENSHOT_BATCH_GUIDE.md`** - Complete guide (15+ min)
- **`SCREENSHOT_EXECUTION_SUMMARY.md`** - Execution summary
- **`SCREENSHOT_IMPLEMENTATION.md`** - Technical implementation (legacy)

### Choose Your Guide

- **Want to get started fast?** → `SCREENSHOT_QUICKSTART.md`
- **Want full details?** → `SCREENSHOT_BATCH_GUIDE.md`
- **Want execution plan?** → `SCREENSHOT_EXECUTION_SUMMARY.md`

## Troubleshooting

### Common Issues

**"DATABASE_URL is not set"**

```bash
./scripts/setup-env-for-screenshots.sh
```

**"Cloudflare credentials not configured"**

```bash
# Edit .env.local and add:
CLOUDFLARE_ACCOUNT_ID=your_id
CLOUDFLARE_API_TOKEN=your_token
```

**High failure rate**

```bash
# Increase delay
./scripts/run-screenshot-batch.sh --delay 15

# Or reduce batch size
./scripts/run-screenshot-batch.sh --batch-size 20
```

**Process stuck**

```bash
# Safe to Ctrl+C and restart
# Uses atomic locking, no duplicates
```

## Best Practices

1. **Always run setup first**

   ```bash
   ./scripts/setup-env-for-screenshots.sh
   ```

2. **Test with dry run**

   ```bash
   ./scripts/run-screenshot-batch.sh --dry-run
   ```

3. **Monitor first batch closely**
   - Watch for errors
   - Check failure rate
   - Adjust settings if needed

4. **Use recommended settings**

   ```bash
   --batch-size 30 --delay 12 --max-failure-rate 0.3
   ```

5. **Save output to file**
   ```bash
   ./scripts/run-screenshot-batch.sh --batch-size 30 --delay 12 | tee batch-log.txt
   ```

## Performance

### Expected Timeline (283 pending)

**Recommended Settings:**

- Batch size: 30
- Delay: 12 minutes
- Total batches: 10
- Duration: ~2.5 hours

**Conservative Settings:**

- Batch size: 20
- Delay: 15 minutes
- Total batches: 15
- Duration: ~3.5 hours

**Aggressive Settings:**

- Batch size: 50
- Delay: 8 minutes
- Total batches: 6
- Duration: ~1.5 hours

## Database Schema

### Products Table (Screenshot Fields)

```sql
screenshot_status         -- 'pending' | 'captured' | 'failed'
screenshot_captured_at    -- Timestamp
screenshot_full_url       -- Local path to full screenshot
screenshot_thumbnail_url  -- Local path to thumbnail
screenshot_next_capture_at -- Lease expiration (for atomic locking)
screenshot_error          -- Error message if failed
seo_title                 -- Page title
seo_meta_description      -- Meta description
seo_og_title              -- Open Graph title
seo_og_description        -- Open Graph description
seo_og_image              -- Open Graph image
seo_twitter_card          -- Twitter Card type
seo_twitter_title         -- Twitter title
seo_twitter_description   -- Twitter description
seo_twitter_image         -- Twitter image
seo_favicon_url           -- Favicon URL
seo_canonical_url         -- Canonical URL
seo_h1                    -- H1 heading
```

## Cost Estimate

**Cloudflare Browser Rendering:**

- Free tier: 1,000 requests/month
- Paid: $5 per 1,000 requests

**For 283 products:**

- Within free tier: $0
- Above free tier: ~$1.50

## Support

**Documentation:**

- Scripts: `scripts/README_SCREENSHOTS.md` (this file)
- Quick Start: `SCREENSHOT_QUICKSTART.md`
- Full Guide: `SCREENSHOT_BATCH_GUIDE.md`

**Contact:**

- Email: outreach@dobacklinks.com

**Logs:**

- Terminal output
- Generated JSON reports
- Database queries

---

**Last Updated:** 2024-12-25
**Status:** Production Ready
