# Dobacklinks Setup Guide

Complete setup guide for the dobacklinks.com guest post directory.

## 📋 Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Access to VPS Supabase database (93.127.133.204:54322)
- SimilarWeb API key

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create `.env.local` from the template:

```bash
cp .env.local.template .env.local
```

**Required variables to fill in:**

```env
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your_generated_secret_here

# VPS Supabase (should already be set)
DATABASE_URL=postgresql://postgres:postgres@93.127.133.204:54322/postgres

# SimilarWeb API
SIMILARWEB_API_URL=http://93.127.133.204:3000/api/v1
SIMILARWEB_API_KEY=pk_publisherlens_xxx

# Generate with: openssl rand -hex 32
CRON_SECRET=your_generated_secret_here
```

### 3. Run Database Migrations

```bash
# Generate migration files
pnpm db:generate

# Apply migrations to database
pnpm db:push
```

### 4. Create System User

Run the SQL script to create the system user for data imports:

```bash
# Connect to database and run:
psql postgresql://postgres:postgres@93.127.133.204:54322/postgres -f scripts/create-system-user.sql
```

Or run directly in your database client:

```sql
INSERT INTO "user" (id, email, name, role, email_verified, created_at, updated_at)
VALUES (gen_random_uuid(), 'system@dobacklinks.com', 'System', 'admin', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
```

### 5. Import Guest Post Sites

Import the 9,700+ sites from the scraper data:

```bash
# Preview import (dry run)
pnpm db:import-sites:dry-run

# Execute real import
pnpm db:import-sites
```

**Expected output:**

- ~500 sites with status 'live' (quality score ≥ 70)
- ~9,200 sites with status 'pending_review'
- All sites enrichmentStatus = 'pending'

### 6. Trigger SimilarWeb Enrichment

Manually trigger the first enrichment batch:

```bash
curl -X GET http://localhost:3000/api/cron/enrich-sites \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Note:** The cron job will run automatically every 15 minutes in production (Vercel Cron).

### 7. Start Development Server

```bash
pnpm dev
```

Visit: http://localhost:3000

## 📁 Project Structure

```
dobacklinks/
├── app/
│   ├── (basic-layout)/
│   │   ├── services/          # Service page (/services)
│   │   ├── sites/[slug]/      # Site detail pages (/sites/example-com)
│   │   └── product/[slug]/    # Legacy redirect to /sites/*
│   ├── (protected)/dashboard/
│   │   ├── (admin)/
│   │   │   ├── examples/      # Published examples (NEW)
│   │   │   ├── products/      # Site management
│   │   │   └── ...
│   │   └── (user)/
│   │       └── profile/
│   └── api/
│       └── cron/
│           └── enrich-sites/  # SimilarWeb enrichment job
├── components/
│   ├── products/
│   │   ├── PublicSiteData.tsx      # Always visible
│   │   ├── PrivateSiteData.tsx     # Logged-in only
│   │   ├── GatedPricing.tsx        # Login gate
│   │   └── SimilarWebMetrics.tsx   # Traffic data
│   └── cta/
│       └── HireMeCTA.tsx           # Service promotion
├── lib/
│   ├── import/                     # Data import pipeline
│   │   ├── types.ts
│   │   ├── quality-scorer.ts
│   │   └── import-sites.ts
│   ├── similarweb/
│   │   └── client.ts              # SimilarWeb API client
│   ├── db/
│   │   └── schema.ts              # Database schema
│   └── auth/
│       └── server.ts              # Auth utilities
├── scripts/
│   ├── import-sites.ts            # Import CLI runner
│   └── create-system-user.sql     # System user setup
├── .env.local.template            # Environment template
├── vercel.json                    # Cron configuration
└── SETUP.md                       # This file
```

## 🔑 Key Features Implemented

### ✅ Database Schema

- Removed all built-in payment infrastructure
- Added guest post specific fields (DR, DA, spam score, pricing, etc.)
- Added SimilarWeb enrichment fields (monthly visits, global rank, etc.)
- Created `publishedExamples` table for admin testimonials

### ✅ RBAC (Role-Based Access Control)

- **Public users**: See basic metrics (DR, DA, traffic, Google News)
- **Logged-in users**: See pricing, turnaround time, contact email
- **Admin users**: See all data + published examples

### ✅ SimilarWeb Integration

- Automatic traffic enrichment via cron job (every 15 min)
- Batch API calls (50 domains per request)
- Manual enrichment trigger available

### ✅ Service Page

- Three tiers: Self-Serve, Guest Posting Service, Custom Lists
- PayPal/USDT payment options
- Email: outreach@dobacklinks.com

### ✅ Admin Features

- Published Examples page (admin only)
- Track successful guest posts
- Use for testimonials on service page

## 🎯 Data Import Details

### Quality Scoring (0-100 points)

| Criteria                    | Points |
| --------------------------- | ------ |
| Google News approved        | +30    |
| Spam score ≤ 5%             | +25    |
| Sample URLs available       | +15    |
| Multiple links allowed (≥2) | +10    |
| Approved before 2022        | +10    |
| High DR (≥70)               | +10    |

### Import Strategy

- **Score ≥ 70**: Status = 'live' (top ~500 sites)
- **Score < 70**: Status = 'pending_review' (remaining ~9,200)
- **All sites**: enrichmentStatus = 'pending'

## 🔄 SimilarWeb Enrichment Process

1. Cron job runs every 15 minutes
2. Fetches 100 products with enrichmentStatus='pending'
3. Batches domains into groups of 50
4. Calls SimilarWeb API for each batch
5. Updates products table with:
   - Monthly visits
   - Global rank
   - Bounce rate
   - Pages per visit
   - Average visit duration
   - Traffic sources breakdown
6. Sets enrichmentStatus='enriched' or 'failed'

## 📊 Site Detail Page Layout

```
┌─────────────────────────────────────────────────┐
│ Header: Name + DR Badge                         │
├───────────────────────────┬─────────────────────┤
│ Left Column (60%)         │ Right Sidebar (40%) │
│                           │                     │
│ - PublicSiteData          │ - SimilarWebMetrics │
│   • Basic info, DR, DA    │   • Monthly visits  │
│   • Google News badge     │   • Global rank     │
│   • Sample URLs           │   • Traffic sources │
│                           │                     │
│ - Screenshots             │ - HireMeCTA         │
│                           │   Sidebar variant   │
│ - Description/Guidelines  │                     │
│                           │ - Featured Sites    │
│ - [Logged-in]             │                     │
│   PrivateSiteData         │                     │
│   • Pricing               │                     │
│   • Contact email         │                     │
│                           │                     │
│ - [Not logged-in]         │                     │
│   GatedPricing            │                     │
│   • Blurred overlay       │                     │
│   • Login CTA             │                     │
│                           │                     │
│ - Related Sites           │                     │
└───────────────────────────┴─────────────────────┘
```

## 🌐 API Endpoints

### Public

- `GET /api/auth/[...all]` - Better Auth endpoints

### Protected (Admin)

- `GET /api/cron/enrich-sites` - SimilarWeb enrichment job
  - Requires `Authorization: Bearer {CRON_SECRET}` header

## 🚢 Deployment (Vercel)

### Environment Variables

Set these in Vercel dashboard:

```env
DATABASE_URL=postgresql://postgres:postgres@93.127.133.204:54322/postgres
BETTER_AUTH_SECRET=<generated>
SIMILARWEB_API_URL=http://93.127.133.204:3000/api/v1
SIMILARWEB_API_KEY=pk_publisherlens_xxx
CRON_SECRET=<generated>
NEXT_PUBLIC_SITE_URL=https://dobacklinks.com

# Auth (if using)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Email (if using)
RESEND_API_KEY=...
ADMIN_EMAIL=outreach@dobacklinks.com

# Storage (if using)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=dobacklinks
R2_PUBLIC_URL=https://cdn.dobacklinks.com
```

### Cron Configuration

The `vercel.json` file is already configured:

```json
{
  "crons": [
    {
      "path": "/api/cron/enrich-sites",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Vercel will automatically call the enrichment endpoint every 15 minutes.

## 🧪 Testing

### Test Authentication

1. Visit http://localhost:3000
2. Click login button
3. Use Google/GitHub OAuth to sign in
4. Verify pricing data is visible on site detail pages

### Test Enrichment

```bash
# Manually trigger enrichment
curl -X GET http://localhost:3000/api/cron/enrich-sites \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check logs for success/failure
# Check database for enrichmentStatus='enriched'
```

### Test RBAC

1. Visit a site detail page without logging in
   - Should see GatedPricing component
2. Log in and refresh
   - Should see PrivateSiteData with pricing

## 📝 Common Tasks

### Add a new published example

1. Go to `/dashboard/examples`
2. Click "Add Example"
3. Select site, add published URL, client niche, notes

### Manually enrich a specific site

```bash
# Via cron endpoint (will process next 100 pending)
curl -X GET http://localhost:3000/api/cron/enrich-sites \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Check enrichment status

```sql
SELECT
  enrichment_status,
  COUNT(*) as count
FROM products
GROUP BY enrichment_status;
```

## 🐛 Troubleshooting

### "drizzle-kit: command not found"

```bash
pnpm install
```

### Database connection errors

- Verify VPS Supabase is running: `nc -zv 93.127.133.204 54322`
- Check DATABASE_URL in .env.local
- Ensure firewall allows connection

### Import fails with "user not found"

- Run `scripts/create-system-user.sql` first
- Verify system user exists: `SELECT * FROM "user" WHERE email='system@dobacklinks.com'`

### SimilarWeb API errors

- Check SIMILARWEB_API_KEY is correct
- Verify API endpoint is accessible: `curl http://93.127.133.204:3000/api/v1/health`
- Check API rate limits

## 📚 Additional Resources

- [Better Auth Docs](https://www.better-auth.com/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

## 🎉 Success Checklist

- [ ] Dependencies installed (`pnpm install`)
- [ ] `.env.local` configured with all required variables
- [ ] Database migrations applied (`pnpm db:push`)
- [ ] System user created
- [ ] Sites imported (~9,700 records)
- [ ] First enrichment batch triggered
- [ ] Development server running (`pnpm dev`)
- [ ] Authentication working (Google/GitHub login)
- [ ] RBAC working (pricing visible after login)
- [ ] SimilarWeb metrics displaying
- [ ] Service page accessible at `/services`

---

**Questions?** Contact: outreach@dobacklinks.com
