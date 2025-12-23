"use server";

import { sendProductApprovedNotification } from "@/actions/products/notify";
import { ProductFormValues } from "@/app/(basic-layout)/submit/schema";
import { ActionResult, actionResponse } from "@/lib/action-response";
import { logAudit } from "@/lib/audit";
import { getSession, isAdmin } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { Category, productCategories, products } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { universalSlugify } from "@/lib/url";
import { ProductQueryParams, ProductWithCategories } from "@/types/product";
import { and, count, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ADMIN_PRODUCTS_PAGE_SIZE = 20;

export async function getProductsAsAdminAction(
  params: ProductQueryParams,
): Promise<ActionResult<{ products: ProductWithCategories[]; count: number }>> {
  if (!(await isAdmin())) {
    return actionResponse.unauthorized();
  }

  const pageIndex = params.pageIndex || 0;
  const pageSize = params.pageSize || ADMIN_PRODUCTS_PAGE_SIZE;
  const start = pageIndex * pageSize;

  try {
    const conditions = [];
    if (params.name) {
      conditions.push(ilike(products.name, `%${params.name}%`));
    }
    if (params.status) {
      if (Array.isArray(params.status)) {
        conditions.push(inArray(products.status, params.status));
      } else {
        conditions.push(eq(products.status, params.status));
      }
    }
    if (typeof params.isFeatured === "boolean") {
      conditions.push(eq(products.isFeatured, params.isFeatured));
    }
    if (params.categoryId) {
      const subquery = db
        .select({ productId: productCategories.productId })
        .from(productCategories)
        .where(eq(productCategories.categoryId, params.categoryId));
      conditions.push(inArray(products.id, subquery));
    }
    if (typeof params.daGte === "number") {
      conditions.push(sql`${products.da} >= ${params.daGte}`);
    }
    if (typeof params.drGte === "number") {
      conditions.push(sql`${products.dr} >= ${params.drGte}`);
    }
    if (params.linkType) {
      conditions.push(eq(products.linkType, params.linkType));
    }
    if (params.priceRange) {
      conditions.push(eq(products.priceRange, params.priceRange));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const productsQuery = db.query.products.findMany({
      where,
      with: {
        productCategories: {
          with: {
            category: {
              columns: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: [
        sql`CASE WHEN ${products.status} = 'pending_review' THEN 1 WHEN ${products.status} = 'pending_payment' THEN 2 ELSE 3 END`,
        desc(products.lastRenewedAt),
        desc(products.submittedAt),
        desc(products.id),
      ],
      offset: start,
      limit: pageSize,
    });

    const countQuery = db
      .select({ value: count() })
      .from(products)
      .where(where);

    const [[{ value: totalCount }], data] = await Promise.all([
      countQuery,
      productsQuery,
    ]);

    const productsData = data.map((p) => {
      const {
        userId,
        logoUrl,
        isFeatured,
        submittedAt,
        lastRenewedAt,
        appImages,
        submitType,
        createdAt,
        updatedAt,
        productCategories,
        ...rest
      } = p;
      return {
        ...rest,
        userId: userId,
        logoUrl: logoUrl,
        isFeatured: isFeatured,
        submittedAt: submittedAt.toISOString(),
        lastRenewedAt: lastRenewedAt?.toISOString() ?? null,
        appImages: appImages,
        submitType: submitType,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        categories: productCategories.map((pc) => pc.category as Category),
      };
    });

    return actionResponse.success({
      products: productsData as unknown as ProductWithCategories[],
      count: totalCount,
    });
  } catch (error) {
    console.error("Error fetching all products for admin:", error);
    return actionResponse.error("Failed to fetch products for admin.");
  }
}

export async function deleteProductAction({
  productId,
}: {
  productId: string;
}): Promise<ActionResult<{ productId: string }>> {
  const session = await getSession();
  if (!(await isAdmin())) {
    return actionResponse.unauthorized("Admin privileges required.");
  }

  if (!productId || !z.string().uuid().safeParse(productId).success) {
    return actionResponse.badRequest("Invalid Product ID provided.");
  }

  try {
    // Get product details before deletion for audit log
    const productToDelete = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: { name: true, slug: true, url: true },
    });

    const deletedProducts = await db
      .delete(products)
      .where(eq(products.id, productId))
      .returning({ id: products.id });

    if (deletedProducts.length === 0) {
      return actionResponse.notFound("Product not found.");
    }

    // Audit log
    await logAudit({
      userId: session?.user?.id,
      action: "delete",
      entityType: "product",
      entityId: productId,
      details: productToDelete
        ? {
            name: productToDelete.name,
            slug: productToDelete.slug,
            url: productToDelete.url,
          }
        : undefined,
    });

    revalidatePath("/");

    return actionResponse.success({ productId });
  } catch (error) {
    console.error(`Delete Product Action Failed for ${productId}:`, error);
    const errorMessage = getErrorMessage(error);
    if (errorMessage.includes("permission denied")) {
      return actionResponse.forbidden(
        "Permission denied to delete this product.",
      );
    }
    return actionResponse.error(errorMessage);
  }
}

/**
 * Internal helper function to approve a product
 * Can be called by admin approval action or automated cron jobs
 */
export async function approveProductInternal(
  productId: string,
): Promise<ActionResult<{ productId: string; slug: string }>> {
  if (!productId || !z.string().uuid().safeParse(productId).success) {
    return actionResponse.badRequest("Invalid Product ID provided.");
  }

  try {
    const updatedProducts = await db
      .update(products)
      .set({ status: "live", linkRel: null, lastRenewedAt: new Date() })
      .where(eq(products.id, productId))
      .returning({
        name: products.name,
        slug: products.slug,
        url: products.url,
        logoUrl: products.logoUrl,
        submitType: products.submitType,
        userId: products.userId,
      });

    if (updatedProducts.length === 0) {
      return actionResponse.notFound("Product not found or failed to update.");
    }
    const productData = updatedProducts[0];

    revalidatePath("/");
    revalidatePath(`/sites/${productData.slug}`);

    // Send email notification
    try {
      await sendProductApprovedNotification({
        name: productData.name,
        slug: productData.slug,
        url: productData.url,
        logoUrl: productData.logoUrl,
        submitType: productData.submitType || "free",
        userId: productData.userId,
      });
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
      // Don't fail the approval process if email fails
    }

    return actionResponse.success({ productId, slug: productData.slug });
  } catch (error) {
    console.error(`Approve Product Failed for ${productId}:`, error);
    const errorMessage = getErrorMessage(error);
    return actionResponse.error(errorMessage);
  }
}

export async function approveProductAction({
  productId,
}: {
  productId: string;
}): Promise<ActionResult<{ productId: string }>> {
  const session = await getSession();
  if (!(await isAdmin())) {
    return actionResponse.unauthorized("Admin privileges required.");
  }

  const result = await approveProductInternal(productId);
  if (!result.success) {
    return result;
  }

  // Audit log
  await logAudit({
    userId: session?.user?.id,
    action: "approve",
    entityType: "product",
    entityId: productId,
    details: {
      previousStatus: "pending_review",
      newStatus: "live",
      slug: result.data?.slug,
    },
  });

  return actionResponse.success({ productId: result.data!.productId });
}

/**
 * Get a single product by ID for admin editing
 */
export async function getProductByIdForAdmin(
  productId: string,
): Promise<ActionResult<ProductFormValues & { id: string }>> {
  if (!(await isAdmin())) {
    return actionResponse.unauthorized("Admin privileges required.");
  }

  if (!productId || !z.string().uuid().safeParse(productId).success) {
    return actionResponse.badRequest("Invalid Product ID provided.");
  }

  try {
    const productData = await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: {
        productCategories: {
          columns: {
            categoryId: true,
          },
        },
      },
    });

    if (!productData) {
      return actionResponse.notFound("Product not found.");
    }

    const categoryIds = productData.productCategories.map(
      (pc) => pc.categoryId,
    );

    const product: ProductFormValues & { id: string } = {
      id: productData.id,
      name: productData.name,
      url: productData.url || "",
      tagline: productData.tagline || "",
      description: productData.description || "",
      logoUrl: productData.logoUrl || "",
      appImages: productData.appImages || [],
      categoryIds,
      niche: productData.niche || "",
      da: productData.da || 0,
      dr: productData.dr || 0,
      traffic: productData.traffic || "",
      priceRange: productData.priceRange || "",
      linkType: (productData.linkType as any) || "dofollow",
      turnaroundTime: productData.turnaroundTime || "",
      contactEmail: productData.contactEmail || "",
    };

    return actionResponse.success(product);
  } catch (error) {
    console.error(
      `Get Product for Admin Action Failed for ${productId}:`,
      error,
    );
    const errorMessage = getErrorMessage(error);
    return actionResponse.error(errorMessage);
  }
}

/**
 * Create a product as admin (directly goes live)
 */
export async function createProductAsAdminAction(
  data: ProductFormValues,
): Promise<ActionResult<{ productId: string }>> {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return actionResponse.unauthorized();
  }

  if (!(await isAdmin())) {
    return actionResponse.unauthorized("Admin privileges required.");
  }

  try {
    const productId = await db.transaction(async (tx) => {
      let slug = universalSlugify(data.name, data.url);

      const existingProduct = await tx.query.products.findFirst({
        columns: { id: true },
        where: eq(products.slug, slug),
      });

      if (existingProduct) {
        const randomSuffix = Math.floor(Math.random() * 10000);
        slug = `${slug}-${randomSuffix}`;
      }

      const [productData] = await tx
        .insert(products)
        .values({
          userId: user.id,
          name: data.name,
          slug: slug,
          tagline: data.tagline,
          description: data.description,
          logoUrl: data.logoUrl,
          appImages: data.appImages,
          url: data.url,
          niche: data.niche,
          da: data.da,
          dr: data.dr,
          traffic: data.traffic,
          linkType: data.linkType,
          priceRange: data.priceRange,
          turnaroundTime: data.turnaroundTime,
          contactEmail: data.contactEmail,
          submitType: "free",
          status: "live",
          lastRenewedAt: new Date(),
          submittedAt: new Date(),
        })
        .returning({ id: products.id });

      if (!productData) {
        tx.rollback();
        return actionResponse.badRequest("Failed to create product.");
      }

      if (data.categoryIds.length > 0) {
        await tx.insert(productCategories).values(
          data.categoryIds.map((categoryId: string) => ({
            productId: productData.id,
            categoryId: categoryId,
          })),
        );
      }

      return productData.id;
    });

    if (typeof productId !== "string") {
      return productId as ActionResult<{ productId: string }>; // Return ActionResult if transaction failed
    }

    // Audit log
    await logAudit({
      userId: user.id,
      action: "create",
      entityType: "product",
      entityId: productId,
      details: {
        name: data.name,
        url: data.url,
        status: "live",
      },
    });

    revalidatePath("/");

    // 自动获取截图和 SEO 数据（后台执行，不阻塞）
    try {
      const { getScreenshotEnrichmentService } = await import(
        "@/lib/services/screenshot-enrichment-service"
      );
      const enrichmentService = getScreenshotEnrichmentService();

      // 异步执行，不等待结果
      enrichmentService.enrichSingleProduct(productId).catch((error) => {
        console.error(
          "Background screenshot capture failed:",
          { productId },
          error,
        );
      });

      console.log("📸 Screenshot capture queued for new product:", {
        productId,
      });
    } catch (error) {
      console.error("Failed to queue screenshot capture:", error);
      // 不阻塞产品创建
    }

    return actionResponse.success({ productId });
  } catch (error) {
    console.error("Create Product as Admin Action Failed:", error);
    const errorMessage = getErrorMessage(error);
    return actionResponse.error(errorMessage);
  }
}

/**
 * Update a product as admin
 */
export async function updateProductAsAdminAction({
  productId,
  data,
}: {
  productId: string;
  data: ProductFormValues;
}): Promise<ActionResult<{}>> {
  const session = await getSession();
  if (!(await isAdmin())) {
    return actionResponse.unauthorized("Admin privileges required.");
  }

  if (!productId || !z.string().uuid().safeParse(productId).success) {
    return actionResponse.badRequest("Invalid Product ID provided.");
  }

  try {
    await db.transaction(async (tx) => {
      const existingProduct = await tx.query.products.findFirst({
        columns: { slug: true },
        where: eq(products.id, productId),
      });

      if (!existingProduct) {
        // This throw will be caught by the outer catch block
        throw new Error("Product not found.");
      }

      const { categoryIds, logoUrl, appImages, ...restOfData } = data;

      await tx
        .update(products)
        .set({
          ...restOfData,
          logoUrl: logoUrl,
          appImages: appImages,
        })
        .where(eq(products.id, productId));

      const existingCategories = await tx.query.productCategories.findMany({
        columns: { categoryId: true },
        where: eq(productCategories.productId, productId),
      });

      const existingCategoryIds = existingCategories.map((c) => c.categoryId);

      const categoriesToAdd = categoryIds.filter(
        (id) => !existingCategoryIds.includes(id),
      );
      const categoriesToRemove = existingCategoryIds.filter(
        (id) => !categoryIds.includes(id),
      );

      if (categoriesToRemove.length > 0) {
        await tx
          .delete(productCategories)
          .where(
            and(
              eq(productCategories.productId, productId),
              inArray(productCategories.categoryId, categoriesToRemove),
            ),
          );
      }

      if (categoriesToAdd.length > 0) {
        await tx.insert(productCategories).values(
          categoriesToAdd.map((categoryId) => ({
            productId: productId,
            categoryId: categoryId,
          })),
        );
      }
      revalidatePath("/");
      revalidatePath(`/sites/${existingProduct.slug}`);
    });

    // Audit log
    await logAudit({
      userId: session?.user?.id,
      action: "update",
      entityType: "product",
      entityId: productId,
      details: {
        name: data.name,
        url: data.url,
      },
    });

    // 如果 URL 变化，重新获取截图（后台执行）
    try {
      const { getScreenshotEnrichmentService } = await import(
        "@/lib/services/screenshot-enrichment-service"
      );
      const enrichmentService = getScreenshotEnrichmentService();

      // 异步执行，不等待结果
      enrichmentService.enrichSingleProduct(productId).catch((error) => {
        console.error(
          "Background screenshot re-capture failed:",
          { productId },
          error,
        );
      });

      console.log("📸 Screenshot re-capture queued for updated product:", {
        productId,
      });
    } catch (error) {
      console.error("Failed to queue screenshot re-capture:", error);
      // 不阻塞产品更新
    }

    return actionResponse.success({});
  } catch (error) {
    console.error(
      `Update Product as Admin Action Failed for ${productId}:`,
      error,
    );
    const errorMessage = getErrorMessage(error);
    if (errorMessage.includes("Product not found.")) {
      return actionResponse.notFound("Product not found.");
    }
    return actionResponse.error(errorMessage);
  }
}
