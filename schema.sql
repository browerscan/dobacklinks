-- Dobacklinks Database Schema
-- Generated from lib/db/schema.ts

-- Create enum types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE post_visibility AS ENUM ('public', 'logged_in', 'subscribers');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pricing_model_enum AS ENUM ('Free', 'Freemium', 'Paid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE product_status_enum AS ENUM ('live', 'cancelled', 'expired', 'pending_payment', 'pending_review');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE product_submission_type_enum AS ENUM ('free', 'one_time', 'monthly_promotion', 'featured', 'sponsor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user table (Better Auth)
CREATE TABLE IF NOT EXISTS "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT false NOT NULL,
  name TEXT,
  image TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  is_anonymous BOOLEAN DEFAULT false NOT NULL,
  referral TEXT,
  banned BOOLEAN,
  ban_reason TEXT,
  ban_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create session table (Better Auth)
CREATE TABLE IF NOT EXISTS session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- Create account table (Better Auth)
CREATE TABLE IF NOT EXISTS account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create verification table (Better Auth)
CREATE TABLE IF NOT EXISTS verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES "user"(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  description TEXT,
  featured_image_url TEXT,
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  status post_status DEFAULT 'draft' NOT NULL,
  visibility post_visibility DEFAULT 'public' NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create post_tags junction table
CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create products table (guest post sites)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT,
  description TEXT,
  logo_url TEXT,
  url TEXT NOT NULL,

  -- Guest post specific fields
  niche TEXT,
  da INTEGER DEFAULT 0,
  dr INTEGER DEFAULT 0,
  traffic TEXT DEFAULT 'N/A',
  link_type TEXT DEFAULT 'dofollow',
  price_range TEXT,
  turnaround_time TEXT,
  contact_email TEXT,
  spam_score INTEGER,
  google_news BOOLEAN DEFAULT false,
  max_links INTEGER,
  required_content_size INTEGER,
  sample_urls JSONB,

  -- SimilarWeb enrichment fields
  similarweb_data JSONB,
  enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'enriched', 'failed')),
  enriched_at TIMESTAMPTZ,
  monthly_visits INTEGER,
  global_rank INTEGER,
  country_rank INTEGER,
  bounce_rate NUMERIC(5, 2),
  pages_per_visit NUMERIC(4, 2),
  avg_visit_duration INTEGER,
  traffic_sources JSONB,

  -- Product metadata
  status product_status_enum DEFAULT 'pending_review' NOT NULL,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  is_featured BOOLEAN DEFAULT false NOT NULL,
  app_images TEXT[],
  link_rel TEXT,
  submit_type product_submission_type_enum DEFAULT 'free',
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_renewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create product_categories junction table
CREATE TABLE IF NOT EXISTS product_categories (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- Create newsletter table
CREATE TABLE IF NOT EXISTS newsletter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed BOOLEAN DEFAULT true NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  unsubscribed_at TIMESTAMPTZ
);

-- Create published_examples table
CREATE TABLE IF NOT EXISTS published_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  published_url TEXT NOT NULL,
  client_niche TEXT,
  published_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_categories_active_order ON categories(is_active, display_order DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_submit_type ON products(submit_type);
CREATE INDEX IF NOT EXISTS idx_products_enrichment ON products(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_products_niche ON products(niche);
CREATE INDEX IF NOT EXISTS idx_products_dr ON products(dr);
CREATE INDEX IF NOT EXISTS idx_products_monthly_visits ON products(monthly_visits);
