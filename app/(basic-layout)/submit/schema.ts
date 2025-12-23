import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .min(1, "Site name is required")
    .max(80, "Site name is too long"),
  url: z.string().url("Please enter a valid URL"),
  tagline: z
    .string()
    .min(1, "Short summary is required")
    .max(160, "Summary is too long"),
  description: z
    .string()
    .min(
      200,
      "Please add at least 200 characters (guest post guidelines, topics, rules).",
    )
    .max(3000, "Description is too long"),
  logoUrl: z
    .string()
    .min(1, "Logo is required.")
    .url("Logo must be a valid URL"),
  appImages: z
    .array(z.string().url("Each screenshot must be a valid URL"))
    .max(4, "You can upload a maximum of 4 images.")
    .optional(),
  categoryIds: z
    .array(z.string())
    .min(1, "Please select at least one category")
    .max(3, "You can select a maximum of 3 categories"),
  niche: z.string().min(1, "Please enter a niche/category").max(50).optional(),
  da: z.coerce.number().min(0).max(100).optional(),
  dr: z.coerce.number().min(0).max(100).optional(),
  traffic: z.string().max(40, "Traffic value too long").optional(),
  priceRange: z.string().max(50, "Price range is too long").optional(),
  linkType: z.enum(["dofollow", "nofollow"]).optional(),
  turnaroundTime: z.string().max(50, "Turnaround time is too long").optional(),
  contactEmail: z.string().email("Please enter a valid email").optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
