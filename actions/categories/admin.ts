"use server";

import { actionResponse, ActionResult } from "@/lib/action-response";
import { isAdmin } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { categories as categoriesSchema } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cache } from "react";

export type Category = typeof categoriesSchema.$inferSelect;

interface CategoryFormData {
  id?: string;
  name: string;
  slug: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
}

export const getAllCategories = cache(
  async (): Promise<ActionResult<Category[]>> => {
    if (!(await isAdmin())) {
      return actionResponse.unauthorized();
    }
    try {
      const data = await db
        .select()
        .from(categoriesSchema)
        .orderBy(desc(categoriesSchema.displayOrder));

      return actionResponse.success(data);
    } catch (error) {
      return actionResponse.error((error as Error).message);
    }
  },
);

export async function upsertCategory(
  formData: CategoryFormData,
): Promise<ActionResult<null>> {
  if (!(await isAdmin())) {
    return actionResponse.unauthorized();
  }

  if (!formData.name?.trim()) {
    return actionResponse.badRequest("Name is required");
  }
  if (!formData.slug?.trim()) {
    return actionResponse.badRequest("Slug is required");
  }

  const { id, ...dataToUpsert } = formData;

  const cleanData = {
    ...dataToUpsert,
    name: formData.name.trim(),
    slug: formData.slug.trim(),
    icon: formData.icon?.trim() || null,
    displayOrder: Number(formData.displayOrder) || 0,
    isActive: Boolean(formData.isActive),
  };

  try {
    if (id) {
      await db
        .update(categoriesSchema)
        .set(cleanData)
        .where(eq(categoriesSchema.id, id));
    } else {
      await db.insert(categoriesSchema).values(cleanData);
    }
  } catch (error) {
    return actionResponse.error((error as Error).message);
  }

  revalidatePath("/");
  revalidatePath(`/categories/${formData.slug}`);

  return actionResponse.success();
}

export async function deleteCategory(id: string): Promise<ActionResult<null>> {
  if (!(await isAdmin())) {
    return actionResponse.unauthorized();
  }

  if (!id) {
    return actionResponse.badRequest("Category ID is required.");
  }

  try {
    await db.delete(categoriesSchema).where(eq(categoriesSchema.id, id));
  } catch (error) {
    return actionResponse.error((error as Error).message);
  }

  revalidatePath("/");
  return actionResponse.success();
}
