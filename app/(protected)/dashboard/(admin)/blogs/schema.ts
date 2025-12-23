import { z } from "zod";

export const tagSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const basePostSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  slug: z.string().min(3, { message: "Slug must be at least 3 characters." }),
  content: z.string().optional(),
  description: z.string().optional(),
  featuredImageUrl: z
    .string()
    .url({ message: "Featured image must be a valid URL if provided." })
    .optional()
    .or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
  visibility: z.enum(["public", "logged_in"]),
  tags: z.array(tagSchema).optional(),
  isPinned: z.boolean().optional(),
});

export const postActionSchema = basePostSchema.extend({
  id: z.string().uuid().optional(),
});
