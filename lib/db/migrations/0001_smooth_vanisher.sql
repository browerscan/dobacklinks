ALTER TABLE "posts" DROP CONSTRAINT "posts_language_slug_unique";--> statement-breakpoint
DROP INDEX "idx_posts_language_status";--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "language";--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_slug_unique" UNIQUE("slug");