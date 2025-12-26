"use server";

import { Category } from "@/actions/categories/admin";
import { ActionResult, actionResponse } from "@/lib/action-response";
import { db } from "@/lib/db";
import { categories as categoriesSchema, productCategories, products } from "@/lib/db/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

export type CategoryWithCount = Category & { productCount: number };

export async function getActiveCategories(): Promise<ActionResult<Category[]>> {
  try {
    const data = await db
      .select()
      .from(categoriesSchema)
      .where(eq(categoriesSchema.isActive, true))
      .orderBy(desc(categoriesSchema.displayOrder), asc(categoriesSchema.id));

    return actionResponse.success(data);
  } catch (error) {
    return actionResponse.error((error as Error).message);
  }
}

export async function getActiveCategoriesWithCounts(): Promise<ActionResult<CategoryWithCount[]>> {
  try {
    const data = await db
      .select({
        id: categoriesSchema.id,
        name: categoriesSchema.name,
        slug: categoriesSchema.slug,
        icon: categoriesSchema.icon,
        displayOrder: categoriesSchema.displayOrder,
        isActive: categoriesSchema.isActive,
        createdAt: categoriesSchema.createdAt,
        productCount: sql<number>`(
          SELECT count(*)::int
          FROM "products" p
          WHERE p.niche = "categories".name
          AND p.status = 'live'
        )`,
      })
      .from(categoriesSchema)
      .where(eq(categoriesSchema.isActive, true))
      .orderBy(desc(categoriesSchema.displayOrder), asc(categoriesSchema.id));

    return actionResponse.success(data);
  } catch (error) {
    return actionResponse.error((error as Error).message);
  }
}

export async function getCategoryBySlug(slug: string): Promise<ActionResult<Category | null>> {
  if (!slug?.trim()) {
    return actionResponse.badRequest("Slug is required");
  }

  try {
    const results = await db
      .select()
      .from(categoriesSchema)
      .where(and(eq(categoriesSchema.slug, slug.trim()), eq(categoriesSchema.isActive, true)))
      .limit(1);

    const data = results[0] ?? null;
    return actionResponse.success(data);
  } catch (error) {
    return actionResponse.error((error as Error).message);
  }
}
export async function getCategorySlugByIds(ids: string[]): Promise<ActionResult<string[] | null>> {
  if (typeof ids !== "object" || !ids.length) {
    return actionResponse.badRequest("IDs are required");
  }

  try {
    const data = await db
      .select({
        slug: categoriesSchema.slug,
      })
      .from(categoriesSchema)
      .where(and(inArray(categoriesSchema.id, ids), eq(categoriesSchema.isActive, true)));

    if (!data || data.length === 0) {
      return actionResponse.success(null);
    }

    return actionResponse.success(data.map((item) => item.slug));
  } catch (error) {
    return actionResponse.error((error as Error).message);
  }
}
