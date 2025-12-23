"use server";

import { actionResponse } from "@/lib/action-response";
import { isAdmin } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { tags as tagsSchema } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { Tag } from "@/types/blog";
import { and, asc, eq, ilike, not } from "drizzle-orm";

interface ListTagsResponse {
  success: boolean;
  data?: { tags: Tag[] };
  error?: string;
}

interface CreateTagResponse {
  success: boolean;
  data?: { tag: Tag };
  error?: string;
}

interface UpdateTagResponse {
  success: boolean;
  data?: { tag: Tag };
  error?: string;
}

interface DeleteTagResponse {
  success: boolean;
  error?: string;
}

export async function listTagsAction({
  query,
}: {
  query?: string;
}): Promise<ListTagsResponse> {
  try {
    let queryBuilder = db
      .select()
      .from(tagsSchema)
      .orderBy(asc(tagsSchema.name));

    if (query) {
      queryBuilder.where(ilike(tagsSchema.name, `%${query}%`));
    }

    const tags = await queryBuilder.limit(100);

    return actionResponse.success({ tags: tags });
  } catch (error) {
    console.error("List tags action failed:", error);
    const errorMessage = getErrorMessage(error);
    if (errorMessage.includes("permission denied")) {
      return actionResponse.forbidden("Permission denied to view tags.");
    }
    return actionResponse.error(errorMessage);
  }
}

export async function createTagAction({
  name,
}: {
  name: string;
}): Promise<CreateTagResponse> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden("Admin privileges required.");
  }

  if (!name) {
    return actionResponse.badRequest("Tag name are required.");
  }

  try {
    const existingTag = await db
      .select({ id: tagsSchema.id })
      .from(tagsSchema)
      .where(eq(tagsSchema.name, name))
      .limit(1);

    if (existingTag.length > 0) {
      return actionResponse.conflict(`Tag "${name}" already exists.`);
    }

    const newTag = await db.insert(tagsSchema).values({ name }).returning();

    if (!newTag || newTag.length === 0) {
      throw new Error("Failed to create tag, no data returned.");
    }

    return actionResponse.success({ tag: newTag[0] });
  } catch (error) {
    console.error("Create tag action failed:", error);
    const errorMessage = getErrorMessage(error);
    if (
      errorMessage.includes("duplicate key value violates unique constraint")
    ) {
      return actionResponse.conflict(`Tag "${name}" already exists.`);
    }
    if (errorMessage.includes("permission denied")) {
      return actionResponse.forbidden("Permission denied to create tags.");
    }
    return actionResponse.error(errorMessage);
  }
}

export async function updateTagAction({
  id,
  name,
}: {
  id: string;
  name: string;
}): Promise<UpdateTagResponse> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden("Admin privileges required.");
  }

  if (!id || !name) {
    return actionResponse.badRequest("Tag ID and name are required.");
  }

  try {
    const existingTag = await db
      .select({ id: tagsSchema.id })
      .from(tagsSchema)
      .where(and(eq(tagsSchema.name, name), not(eq(tagsSchema.id, id))))
      .limit(1);

    if (existingTag.length > 0) {
      return actionResponse.conflict(
        `Another tag with the name "${name}" already exists.`,
      );
    }

    const updatedTag = await db
      .update(tagsSchema)
      .set({ name })
      .where(eq(tagsSchema.id, id))
      .returning();

    if (!updatedTag || updatedTag.length === 0) {
      throw new Error("Failed to update tag, no data returned.");
    }

    return actionResponse.success({ tag: updatedTag[0] });
  } catch (error) {
    console.error("Update tag action failed:", error);
    const errorMessage = getErrorMessage(error);
    if (
      errorMessage.includes("duplicate key value violates unique constraint")
    ) {
      return actionResponse.conflict(
        `Tag name "${name}" is already in use by another tag.`,
      );
    }
    if (errorMessage.includes("permission denied")) {
      return actionResponse.forbidden("Permission denied to update tags.");
    }
    return actionResponse.error(errorMessage);
  }
}

export async function deleteTagAction({
  id,
}: {
  id: string;
}): Promise<DeleteTagResponse> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden("Admin privileges required.");
  }

  if (!id) {
    return actionResponse.badRequest("Tag ID is required.");
  }

  try {
    await db.delete(tagsSchema).where(eq(tagsSchema.id, id));

    return actionResponse.success({});
  } catch (error) {
    console.error("Delete tag action failed:", error);
    const errorMessage = getErrorMessage(error);
    if (errorMessage.includes("permission denied")) {
      return actionResponse.forbidden("Permission denied to delete tags.");
    }
    if (errorMessage.includes("violates foreign key constraint")) {
      return actionResponse.badRequest(
        "Cannot delete tag as it is currently in use by one or more posts.",
      );
    }
    return actionResponse.error(errorMessage);
  }
}
