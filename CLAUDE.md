# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dobacklinks is a guest post directory and personal outreach service built with Next.js 16.0.7 and React 19.2.1. It's based on the [Nexty Directory template](https://nexty.dev/) and features:

- **9,700+ guest post sites** imported from scraper data with quality scoring
- **SimilarWeb traffic data** integration for monthly visits, bounce rates, and traffic sources
- **Role-based access control** - Public users see basic metrics, logged-in users see pricing/contact info
- **Personal outreach service** promoted via "Hire Me" CTAs throughout the site
- **English-only** (no internationalization)
- **Manual payments** - Uses PayPal/USDT invoices for services

Live Site: https://dobacklinks.com
Contact: outreach@dobacklinks.com

## Tech Stack

- **Framework**: Next.js 16.0.7 (App Router), React 19.2.1, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Drizzle ORM (VPS Supabase at 93.127.133.204:54322)
- **Authentication**: Better Auth with Google/GitHub OAuth
- **Traffic Data**: SimilarWeb API integration (cron-based enrichment)
- **Storage**: Cloudflare R2 (AWS S3-compatible)
- **Email**: Resend with React email templates
- **State**: Zustand
- **Rate Limiting**: Upstash Redis
- **Package Manager**: pnpm (required, not npm or yarn)

**REMOVED**: Built-in payments, next-intl internationalization

## Development Commands

```bash
# Development
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm analyze          # Build with bundle analyzer

# Database (Drizzle)
pnpm db:generate      # Generate migrations from schema
pnpm db:push          # Push schema directly (recommended for VPS setup)
pnpm db:studio        # Open Drizzle Studio GUI

# Data Import (Guest Post Sites)
pnpm db:import-sites:dry-run  # Preview import from scraper data
pnpm db:import-sites           # Execute import (~9,700 sites)
```

## Quick Setup

See [SETUP.md](./SETUP.md) for complete setup instructions. Quick version:

1. `pnpm install`
2. Copy `.env.local.template` to `.env.local` and configure
3. `pnpm db:push` - Apply database schema
4. Run `scripts/create-system-user.sql` - Create system user
5. `pnpm db:import-sites` - Import 9,700+ sites
6. Trigger enrichment: `curl -X GET http://localhost:3000/api/cron/enrich-sites -H "Authorization: Bearer YOUR_CRON_SECRET"`

## Core Architecture

### Directory Structure

- **`app/`** - Next.js App Router pages and layouts
  - `(directory)/` - Product listing and category pages
  - `(basic-layout)/` - Marketing pages and site details
    - `services/` - Service page (outreach offerings)
    - `sites/[slug]/` - Site detail pages with RBAC
    - `product/[slug]/` - Legacy redirect to /sites/\*
  - `(protected)/dashboard/` - User dashboard and admin panel
    - `(admin)/examples/` - **NEW**: Published examples management
    - `(admin)/products/` - Site management
  - `api/` - API route handlers
    - `blogs/` - **NEW**: Blog post creation API (HMAC-authenticated)
    - `cron/enrich-sites/` - **NEW**: SimilarWeb enrichment job
- **`actions/`** - Server Actions for business logic
- **`components/`** - React components
  - `ui/` - shadcn/ui primitives
  - `products/` - **NEW RBAC components**:
    - `PublicSiteData.tsx` - Always visible (DR, DA, traffic, Google News)
    - `PrivateSiteData.tsx` - Logged-in only (pricing, contact email)
    - `GatedPricing.tsx` - Login gate for non-authenticated users
    - `SimilarWebMetrics.tsx` - Traffic data visualization
  - `cta/HireMeCTA.tsx` - **NEW**: Service promotion component
- **`lib/`** - Backend utilities and integrations
  - `db/` - Drizzle schema (`schema.ts`), migrations
  - `auth/` - Better Auth configuration
  - `similarweb/client.ts` - **NEW**: SimilarWeb API client
  - `import/` - **NEW**: Data import pipeline
    - `types.ts` - Scraper data interfaces
    - `quality-scorer.ts` - Quality scoring algorithm (0-100 points)
    - `import-sites.ts` - Batch import logic
  - `cloudflare/r2.ts` - R2 storage helpers
  - `resend/` - Email client
- **`scripts/`** - **NEW**: Setup and utility scripts
  - `import-sites.ts` - CLI runner for data import
  - `create-system-user.sql` - System user creation
- **`config/`** - Configuration files
  - `site.ts` - Site metadata (updated: outreach@dobacklinks.com)
  - `menus.ts` - Navigation structure (includes Services link)
- **`emails/`** - Resend email templates
- **`types/`** - Shared TypeScript types

### Database Schema (lib/db/schema.ts)

**Major changes from Nexty template:**

**REMOVED:**

- Legacy payment tables (`pricing_plans`, `orders`, `subscriptions`)
- Legacy payment/customer ID fields on `user`

**ADDED - Guest Post Fields:**

- `niche` - Technology, Finance, Health, etc.
- `da` - Domain Authority (Moz)
- `dr` - Domain Rating (Ahrefs)
- `traffic` - Traffic tier ("100K-1M", "1M+")
- `linkType` - 'dofollow' | 'nofollow'
- `priceRange` - Guest post pricing (private, logged-in only)
- `turnaroundTime` - "2-3 days", "1 week"
- `contactEmail` - Direct contact (private, logged-in only)
- `spamScore` - From scraper data
- `googleNews` - Boolean, Google News approval status
- `maxLinks` - Number of links allowed
- `requiredContentSize` - Minimum word count
- `sampleUrls` - JSONB array of example posts

**ADDED - SimilarWeb Enrichment:**

- `similarwebData` - Full API response (JSONB)
- `enrichmentStatus` - 'pending' | 'enriched' | 'failed'
- `enrichedAt` - Timestamp of last enrichment
- `monthlyVisits` - Monthly visitor count
- `globalRank` - Global Alexa-style rank
- `countryRank` - Country-specific rank
- `bounceRate` - Percentage
- `pagesPerVisit` - Average pages per session
- `avgVisitDuration` - Average session length in seconds
- `trafficSources` - JSONB breakdown (direct, search, referral, social, mail, display)

**NEW TABLES:**

- `newsletter` - Email subscriptions
- `publishedExamples` - Admin-only success cases
  - Fields: productId, publishedUrl, clientNiche, publishedDate, notes
  - Purpose: Track successful guest posts for testimonials

**Indexes:**

- `idx_products_status` - Query by status
- `idx_products_enrichment` - Query by enrichment status
- `idx_products_niche` - Filter by niche
- `idx_products_dr` - Sort by DR
- `idx_products_monthly_visits` - Sort by traffic

## Business Logic: Data Import & Quality Scoring

### Quality Scoring Algorithm (lib/import/quality-scorer.ts)

Sites imported from scraper data receive a quality score (0-100 points):

| Criteria                                | Points |
| --------------------------------------- | ------ |
| Google News approved                    | +30    |
| Spam score ≤ 5%                         | +25    |
| Sample URLs available                   | +15    |
| Multiple links allowed (≥2)             | +10    |
| Approved before 2022 (established site) | +10    |
| High DR (≥70)                           | +10    |

**Scoring tiers:**

- **Premium** (≥90): Top-tier sites
- **High** (70-89): Quality sites → Automatically set to 'live'
- **Medium** (50-69): Decent sites → 'pending_review'
- **Low** (<50): Lower quality → 'pending_review'

### Import Strategy (scripts/import-sites.ts)

1. Load sites from `/Volumes/SSD/dev/links/dobacklinks/scraper/active-sites-complete.json`
2. Filter successful scrapes only
3. Score each site using quality algorithm
4. Sort by score (highest first)
5. **Top 500 sites** (score ≥70) → `status: 'live'`
6. **Remaining sites** → `status: 'pending_review'`
7. **All sites** → `enrichmentStatus: 'pending'` (awaiting SimilarWeb data)
8. Import in batches of 50 to prevent memory issues
9. Automatically infer niche from domain keywords

**Niche Inference:**

- Technology: 'tech', 'software', 'ai', 'crypto', 'startup'
- Finance: 'finance', 'money', 'invest', 'trading', 'bank'
- Health: 'health', 'medical', 'fitness', 'wellness'
- Marketing: 'marketing', 'seo', 'social', 'content'
- Business: 'business', 'entrepreneur', 'corporate'
- Lifestyle: 'lifestyle', 'fashion', 'travel', 'food'

### SimilarWeb Enrichment

**Schedule**: **Manual-only** (automatic cron removed - SimilarWeb data doesn't update frequently)

**Process:**

1. Query 100 products with `enrichmentStatus = 'pending'`
2. Extract domains and batch into groups of 50 (API limit)
3. Call SimilarWeb API via `EnrichmentService` (`lib/services/enrichment-service.ts`)
4. Parse response and update products table with:
   - `monthlyVisits` - Formatted traffic count
   - `globalRank` - Alexa-style global rank
   - `bounceRate` - Visitor engagement metric
   - `pagesPerVisit` - Session depth
   - `avgVisitDuration` - Average session time
   - `trafficSources` - Breakdown by channel
5. Set `enrichmentStatus = 'enriched'` on success
6. Set `enrichmentStatus = 'failed'` if no data available or API error
7. Frontend hides SimilarWeb component for failed/pending products

**Manual trigger via API:**

```bash
curl -X GET http://localhost:3000/api/cron/enrich-sites \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Full enrichment script:**

```bash
# Process all pending products in batches of 100
CRON_SECRET=your_secret ./scripts/run-full-enrichment.sh

# Monitor progress
./scripts/check-enrichment-progress.sh
```

**Server Actions** (for future management UI):

- `enrichAllPendingAction()` - Process all pending products
- `enrichProductsAction(productIds)` - Enrich specific products
- `enrichSingleProductAction(productId)` - Enrich one product
- `resetFailedToPendingAction(productIds?)` - Retry failed products
- `getEnrichmentStatsAction()` - Get status distribution

See `actions/enrichment/index.ts` and `lib/services/enrichment-service.ts` for implementation.

## Role-Based Access Control (RBAC)

### Data Visibility Rules

**Public (Anonymous) Users:**

- Site name, URL, logo
- Description, tagline
- Niche/category
- Domain Authority (DA), Domain Rating (DR)
- Spam score
- Link type (dofollow/nofollow)
- **SimilarWeb metrics** (monthly visits, global rank, bounce rate, traffic sources)
- Sample URLs
- Google News status

**Logged-In Users (Additional Access):**

- **Price range** (e.g., "$100-$200")
- **Turnaround time** ("2-3 days")
- **Contact email** (direct outreach)
- **Max links allowed**
- **Required content size** (word count)

**Admin Users (Additional Access):**

- Published examples (success cases)
- All pending submissions
- User management
- Full database access

### RBAC Implementation

**Server Component Pattern:**

```typescript
// app/(basic-layout)/sites/[slug]/ProductDetailContent.tsx
import { getSession } from "@/lib/auth/server";

export async function ProductDetailContent({ product }) {
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  return (
    <>
      <PublicSiteData product={product} />

      {isLoggedIn ? (
        <PrivateSiteData product={product} />
      ) : (
        <GatedPricing />
      )}

      <SimilarWebMetrics product={product} />
    </>
  );
}
```

**Components:**

- `PublicSiteData.tsx` - Always rendered
- `PrivateSiteData.tsx` - Conditionally rendered for authenticated users
- `GatedPricing.tsx` - Login gate with blurred pricing overlay
- `SimilarWebMetrics.tsx` - Traffic visualization (always visible)

## Personal Outreach Service

### Service Tiers (app/(basic-layout)/services/page.tsx)

1. **Self-Serve Directory** (Free)
   - Browse DR, traffic, pricing
   - Use filters and reach out yourself

2. **Guest Posting Service** (Contact for quote)
   - Full service: outreach, writing, publication
   - Payment: PayPal/USDT
   - Contact: outreach@dobacklinks.com

3. **Custom List / Data Export** (Custom pricing)
   - CSV export of filtered sites
   - Cleaned data with DR/traffic/pricing
   - Niche-specific lists

### "Hire Me" CTAs

**Component:** `components/cta/HireMeCTA.tsx`

**Variants:**

- **Sidebar** - Vertical card on site detail pages
- **Inline** - Horizontal banner in directory listings
- **Modal** - Popup after 30s browsing (future)

**Placement:**

- Site detail page sidebar
- Every 10th result in directory listing
- Homepage hero section
- 404 page ("Can't find what you need?")
- After login welcome modal

## Published Examples (Admin Feature)

**Purpose:** Track successful guest posts for:

- Testimonials on service page (anonymized)
- Client reporting and accountability
- Internal metrics (which sites perform best)

**Admin Page:** `/dashboard/examples`

**Features:**

- Add new example: site + published URL + client niche + notes
- View all examples in table format
- Edit/delete examples
- Export for reporting

**Table Schema:**

```typescript
publishedExamples {
  id: uuid
  productId: uuid (FK to products)
  publishedUrl: text
  clientNiche: text
  publishedDate: date
  notes: text
  createdAt: timestamp
}
```

## Authentication

Uses Better Auth with Drizzle adapter:

- **Server**: `lib/auth/server.ts` - Auth configuration, `getSession()`, `isAdmin()`
- **Client**: `lib/auth/auth-client.ts` - React hooks and client methods
- **Providers**: Google OAuth, GitHub OAuth
- **Protection**: Use `getSession()` in Server Components/Actions for user detection

**RBAC Pattern:**

```typescript
const session = await getSession();
const isLoggedIn = !!session?.user;
// Conditionally render PrivateSiteData vs GatedPricing
```

## REST API

### POST /api/blogs - Create Blog Posts

Programmatically create blog posts via REST API with HMAC authentication.

**Features:**

- HMAC-SHA256 authentication (replay attack protection)
- Automatic system user creation
- Tag association support
- Path revalidation on publish
- Slug uniqueness validation

**Authentication:**

Uses `CRON_SECRET` for HMAC signature generation:

```typescript
const signature = generateHMACSignature(
  "POST",
  "/api/blogs",
  timestamp,
  body,
  CRON_SECRET,
);

// Headers:
// Authorization: HMAC <signature>
// X-Timestamp: <unix_timestamp_ms>
```

**Request Body:**

```json
{
  "title": "My Blog Post",
  "slug": "my-blog-post",
  "content": "# Content here...",
  "description": "Post description",
  "status": "published", // "draft" | "published" | "archived"
  "visibility": "public", // "public" | "logged_in"
  "featuredImageUrl": "",
  "isPinned": false,
  "tags": [{ "id": "uuid", "name": "tag-name" }]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "postId": "uuid",
    "slug": "my-blog-post"
  }
}
```

**Testing:**

```bash
# TypeScript
pnpm tsx scripts/test-blog-api.ts

# Python
python scripts/test-blog-api.py
```

**Documentation:** See [docs/API.md](./docs/API.md) for complete API reference.

## Environment Variables

See `.env.local.template` for comprehensive setup. Critical variables:

**Required:**

- `DATABASE_URL` - VPS Supabase: `postgresql://postgres:postgres@93.127.133.204:54322/postgres`
- `BETTER_AUTH_SECRET` - Generate with `openssl rand -base64 32`
- `SIMILARWEB_API_URL` - `http://93.127.133.204:3000/api/v1`
- `SIMILARWEB_API_KEY` - SimilarWeb API key
- `CRON_SECRET` - Generate with `openssl rand -hex 32` (used for cron jobs AND API authentication)

**Optional:**

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth
- `NEXT_PUBLIC_GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `RESEND_API_KEY`, `ADMIN_EMAIL` - Email sending
- `R2_*` - Cloudflare R2 storage credentials
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` - Rate limiting

Never commit secrets to git. Use `.env.local` for development.

## Code Style

- Use server actions in `actions/` for mutations
- API routes for webhooks/external integrations only
- All database queries use Drizzle ORM
- Server components by default, add `'use client'` when needed
- Consistent API responses via `lib/api-response.ts` and `lib/action-response.ts`
- Form validation with react-hook-form + zod
- Use `lib/validations.ts` for shared validation schemas
- RBAC via `getSession()` + conditional rendering

## Important Notes

- **Payments are manual** - Use PayPal/USDT invoices and direct users to `/services`
- **Quality scoring** - Automated import prioritizes top 500 sites (score ≥70) as 'live'
- **SimilarWeb enrichment** - **Manual-only** (automatic cron removed). Use `./scripts/run-full-enrichment.sh` to process pending products
- **RBAC critical** - Never expose pricing/contact data in public API endpoints
- **Product lifecycle**: Import → `pending_review` → (admin approval) → `live`
- **Rate limiting** - Uses Upstash Redis for daily submission limits
- **English only** - Internationalization (next-intl) not actively used
- **VPS Supabase** - Database at 93.127.133.204:54322, not cloud Neon

## Deployment Checklist

Before deploying to production:

1. ✅ Configure all environment variables in Vercel
2. ✅ Run database migrations: `pnpm db:push`
3. ✅ Create system user: `psql -f scripts/create-system-user.sql`
4. ✅ Import sites: `pnpm db:import-sites`
5. ✅ Run initial enrichment: `CRON_SECRET=xxx ./scripts/run-full-enrichment.sh`
6. ✅ Test enrichment endpoint manually
7. ✅ Test auth login flow (Google/GitHub)
8. ✅ Verify RBAC: pricing hidden when logged out
9. ✅ Test "Hire Me" email links
10. ✅ Check service page displays correctly

## Useful Queries

```sql
-- Check enrichment status
SELECT enrichment_status, COUNT(*) as count
FROM products
GROUP BY enrichment_status;

-- Top sites by traffic
SELECT name, monthly_visits, global_rank, dr
FROM products
WHERE enrichment_status = 'enriched'
ORDER BY monthly_visits DESC NULLS LAST
LIMIT 20;

-- Sites by niche
SELECT niche, COUNT(*) as count, AVG(dr) as avg_dr
FROM products
WHERE status = 'live'
GROUP BY niche
ORDER BY count DESC;

-- Published examples
SELECT
  p.name as site,
  pe.published_url,
  pe.client_niche,
  pe.published_date
FROM published_examples pe
LEFT JOIN products p ON pe.product_id = p.id
ORDER BY pe.published_date DESC;
```

## For Future Claude Instances

If you're working on this codebase:

1. **Read [SETUP.md](./SETUP.md)** for complete setup instructions
2. **Built-in payments are removed** - Don't suggest checkout/subscription integrations
3. **RBAC is critical** - Always check user session before showing sensitive data
4. **Scraper data at** `/Volumes/SSD/dev/links/dobacklinks/scraper/active-sites-complete.json`
5. **Contact email** is `outreach@dobacklinks.com` (not hi@)
6. **Quality scoring** prioritizes Google News, low spam, high DR sites
7. **SimilarWeb enrichment** is automated via cron, manual trigger available

---

Last updated: 2024-12-12
