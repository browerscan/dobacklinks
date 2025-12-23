CREATE TYPE "public"."pricing_model_enum" AS ENUM('Free', 'Freemium', 'Paid');--> statement-breakpoint
CREATE TYPE "public"."product_status_enum" AS ENUM('live', 'cancelled', 'expired', 'pending_payment', 'pending_review');--> statement-breakpoint
CREATE TYPE "public"."product_submission_type_enum" AS ENUM('free', 'monthly_promotion', 'featured', 'sponsor', 'one_time');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "product_categories_product_id_category_id_pk" PRIMARY KEY("product_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"tagline" text,
	"description" text,
	"logo_url" text,
	"url" text,
	"youtube_url" text,
	"founded_year" integer,
	"pricing_model" "pricing_model_enum",
	"discount_code" text,
	"status" "product_status_enum" DEFAULT 'pending_review' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_renewed_at" timestamp with time zone,
	"platforms" text[],
	"app_images" text[],
	"affiliate_url" text,
	"founder_twitter" text,
	"submit_type" "product_submission_type_enum",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "submitted_product_id" uuid;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_categories_active_order" ON "categories" USING btree ("is_active","display_order" desc) WHERE "categories"."is_active" = true;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_submitted_product_id_products_id_fk" FOREIGN KEY ("submitted_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;