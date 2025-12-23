import { tags as tagsSchema } from "@/lib/db/schema";

export type BlogPost = {
  locale?: string;
  title: string;
  description?: string;
  featuredImageUrl?: string;
  slug: string;
  tags?: string;
  publishedAt: Date;
  status?: "draft" | "published" | "archived";
  visibility?: "public" | "logged_in" | "subscribers";
  isPinned?: boolean;
  content: string;
  metadata?: {
    [key: string]: any;
  };
};

export type Tag = typeof tagsSchema.$inferSelect;
