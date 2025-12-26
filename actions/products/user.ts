"use server";

import { sendProductSubmissionNotification } from "@/actions/discord/notifications";
import { ProductFormValues } from "@/app/(basic-layout)/submit/schema";
import { siteConfig } from "@/config/site";
import { ActionResult, actionResponse } from "@/lib/action-response";
import { getSession, isAdmin } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { productCategories, products as productsSchema } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { checkRateLimit, getClientIPFromHeaders, RedisFallbackMode } from "@/lib/upstash";
import { universalSlugify } from "@/lib/url";
import { and, count, desc, eq, ilike, inArray, ne, sql, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ProductSubmissionType, ProductWithCategories, UserProductFilters } from "types/product";

/**
 * Create a free product(pending review)
 */
export async function createFreeProductAction(
  data: ProductFormValues,
): Promise<ActionResult<{ productId: string }>> {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return actionResponse.unauthorized();
  }

  // Rate limiting for non-admin users
  if (!(await isAdmin())) {
    const clientIP = await getClientIPFromHeaders();
    const isAllowed = await checkRateLimit(
      clientIP,
      {
        prefix: `${siteConfig.name.trim()}-submit`,
        maxRequests: parseInt(process.env.NEXT_PUBLIC_DAILY_SUBMIT_LIMIT || "30"),
        window: "1 d",
      },
      RedisFallbackMode.MEMORY_FALLBACK,
    );

    if (!isAllowed) {
      return actionResponse.badRequest(
        `Rate limit exceeded. You can submit/update products up to ${process.env.NEXT_PUBLIC_DAILY_SUBMIT_LIMIT || "30"} times per day.`,
      );
    }
  }

  try {
    const submitType = "free";
    const result = await _createProductAction(data, user.id, submitType);

    if (!result.success || !result.data?.productId) {
      return actionResponse.badRequest("Failed to create product after verification.");
    }

    // Send Discord notification for product submission
    try {
      sendProductSubmissionNotification({
        productData: data,
        productId: result.data.productId,
        submitType: "free",
        status: "pending_review",
      });
    } catch (error) {
      // Don't fail the product creation if Discord notification fails
      console.error("Failed to send Discord notification:", getErrorMessage(error));
    }

    revalidatePath("/");

    return actionResponse.success({ productId: result.data.productId });
  } catch (err) {
    return actionResponse.error(getErrorMessage(err));
  }
}

/**
 * Create a paid product(pending payment)
 */
export async function createPendingPaymentProductAction({
  data,
  submitType,
}: {
  data: ProductFormValues;
  submitType: ProductSubmissionType;
}): Promise<ActionResult<{ productId: string }>> {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return actionResponse.unauthorized();
  }

  // Rate limiting for non-admin users
  if (!(await isAdmin())) {
    const clientIP = await getClientIPFromHeaders();
    const isAllowed = await checkRateLimit(
      clientIP,
      {
        prefix: `${siteConfig.name.trim()}-submit`,
        maxRequests: parseInt(process.env.NEXT_PUBLIC_DAILY_SUBMIT_LIMIT || "30"),
        window: "1 d",
      },
      RedisFallbackMode.MEMORY_FALLBACK,
    );

    if (!isAllowed) {
      return actionResponse.badRequest(
        `Rate limit exceeded. You can submit/update products up to ${process.env.NEXT_PUBLIC_DAILY_SUBMIT_LIMIT || "30"} times per day.`,
      );
    }
  }

  try {
    const result = await _createProductAction(data, user.id, submitType);
    if (!result.success || !result.data?.productId) {
      return result;
    }

    // Send Discord notification for product submission
    try {
      sendProductSubmissionNotification({
        productData: data,
        productId: result.data.productId,
        submitType: submitType,
        status: "pending_review",
      });
    } catch (error) {
      // Don't fail the product creation if Discord notification fails
      console.error("Failed to send Discord notification:", getErrorMessage(error));
    }

    return actionResponse.success({ productId: result.data.productId });
  } catch (err) {
    return actionResponse.error(getErrorMessage(err));
  }
}

/**
 * Create a product(internal use)
 */
async function _createProductAction(
  data: ProductFormValues,
  userId: string,
  submitType: ProductSubmissionType,
): Promise<ActionResult<{ productId: string }>> {
  try {
    const productId = await db.transaction(async (tx) => {
      let slug = universalSlugify(data.name, data.url);

      const existingProduct = await tx.query.products.findFirst({
        columns: { id: true },
        where: eq(productsSchema.slug, slug),
      });

      if (existingProduct) {
        // Use cryptographically secure random suffix instead of Math.random()
        const randomSuffix = crypto.randomUUID().split("-")[0];
        slug = `${slug}-${randomSuffix}`;
      }

      const [newProduct] = await tx
        .insert(productsSchema)
        .values({
          userId,
          name: data.name,
          slug,
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
          submitType: submitType,
          status: "pending_review", // All submissions go to pending_review for approval
        })
        .returning({ id: productsSchema.id });

      if (!newProduct?.id) {
        tx.rollback();
        // This will be caught by the outer catch and returned as a bad request
        throw new Error("Failed to create product.");
      }

      if (data.categoryIds.length > 0) {
        await tx.insert(productCategories).values(
          data.categoryIds.map((categoryId: string) => ({
            productId: newProduct.id,
            categoryId: categoryId,
          })),
        );
      }
      return newProduct.id;
    });

    return actionResponse.success({ productId });
  } catch (err) {
    return actionResponse.badRequest(getErrorMessage(err));
  }
}

/**
 * Get products
 */
const USER_PRODUCTS_PAGE_SIZE = 48;

/**
 * Core products fetching function
 */
async function _getProductsCore(
  filters: UserProductFilters,
): Promise<ActionResult<{ products: ProductWithCategories[]; count: number }>> {
  const pageIndex = filters.pageIndex || 0;
  const pageSize = filters.pageSize || USER_PRODUCTS_PAGE_SIZE;
  const start = pageIndex * pageSize;

  try {
    const conditions = [];
    if (filters.userId) {
      conditions.push(eq(productsSchema.userId, filters.userId));
    }
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(inArray(productsSchema.status, filters.status));
      } else {
        conditions.push(eq(productsSchema.status, filters.status));
      }
    }
    if (filters.name) {
      conditions.push(ilike(productsSchema.name, `%${filters.name}%`));
    }
    if (filters.categoryId) {
      const subquery = db
        .select({ productId: productCategories.productId })
        .from(productCategories)
        .where(eq(productCategories.categoryId, filters.categoryId));
      conditions.push(inArray(productsSchema.id, subquery));
    }
    if (typeof filters.isFeatured === "boolean") {
      conditions.push(eq(productsSchema.isFeatured, filters.isFeatured));
    }
    if (filters.submitType) {
      conditions.push(eq(productsSchema.submitType, filters.submitType));
    }
    if (typeof filters.daGte === "number") {
      conditions.push(gte(productsSchema.da, filters.daGte));
    }
    if (typeof filters.drGte === "number") {
      conditions.push(gte(productsSchema.dr, filters.drGte));
    }
    if (filters.linkType) {
      conditions.push(eq(productsSchema.linkType, filters.linkType));
    }
    if (filters.priceRange) {
      conditions.push(eq(productsSchema.priceRange, filters.priceRange));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const productsQuery = db.query.products.findMany({
      columns: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        logoUrl: true,
        url: true,
        submitType: true,
        status: true,
        submittedAt: true,
        isFeatured: true,
        niche: true,
        da: true,
        dr: true,
        traffic: true,
        priceRange: true,
        isVerified: true,
        // Guest post fields
        linkType: true,
        spamScore: true,
        googleNews: true,
        maxLinks: true,
        requiredContentSize: true,
        // SimilarWeb enrichment fields
        enrichmentStatus: true,
        enrichedAt: true,
        monthlyVisits: true,
        globalRank: true,
        countryRank: true,
        bounceRate: true,
        pagesPerVisit: true,
        avgVisitDuration: true,
        trafficSources: true,
        similarwebData: true,
      },
      where,
      with: {
        productCategories: {
          with: {
            category: {
              columns: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: [
        desc(productsSchema.lastRenewedAt),
        desc(productsSchema.submittedAt),
        desc(productsSchema.id),
      ],
      offset: start,
      limit: pageSize,
    });

    const countQuery = db.select({ value: count() }).from(productsSchema).where(where);

    const [[{ value: totalCount }], data] = await Promise.all([countQuery, productsQuery]);

    const productsData = data.map((p) => ({
      ...p,
      categories: p.productCategories.map((pc) => pc.category),
    }));

    return actionResponse.success({
      products: productsData as unknown as ProductWithCategories[],
      count: totalCount,
    });
  } catch (error) {
    return actionResponse.error("Failed to fetch products.");
  }
}

/**
 * Get products
 */
export async function getProducts(
  filters: UserProductFilters,
): Promise<ActionResult<{ products: ProductWithCategories[]; count: number }>> {
  return _getProductsCore(filters);
}

export async function getFeaturedProducts(
  filters: Omit<UserProductFilters, "isFeatured"> = {},
): Promise<ActionResult<{ products: ProductWithCategories[]; count: number }>> {
  return getProducts({
    ...filters,
    isFeatured: true,
  });
}

export async function getLatestProducts(
  filters: Omit<UserProductFilters, "isFeatured">,
): Promise<ActionResult<{ products: ProductWithCategories[]; count: number }>> {
  return getProducts({
    ...filters,
    status: ["live"], // Removed 'expired' - not in DB enum yet
  });
}

export async function getMyProducts(
  filters: Partial<Pick<UserProductFilters, "pageIndex" | "pageSize">> = {},
): Promise<ActionResult<{ products: ProductWithCategories[]; count: number }>> {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return actionResponse.unauthorized();
  }

  return getProducts({ ...filters, userId: user.id });
}

export async function getProductByIdForEdit(
  productId: string,
): Promise<ActionResult<ProductFormValues & { id: string }>> {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return actionResponse.unauthorized();
  }

  const product = await db.query.products.findFirst({
    where: and(eq(productsSchema.id, productId), eq(productsSchema.userId, user.id)),
    with: {
      productCategories: {
        columns: {
          categoryId: true,
        },
      },
    },
  });

  if (!product) {
    return actionResponse.notFound("Product not found.");
  }

  const { productCategories, ...rest } = product;

  const productData = {
    ...rest,
    categoryIds: productCategories.map((c) => c.categoryId),
  };

  return actionResponse.success(productData as any);
}

export async function updateMyProductAction({
  productId,
  data,
}: {
  productId: string;
  data: ProductFormValues;
}): Promise<ActionResult<{}>> {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return actionResponse.unauthorized();
  }

  // Rate limiting for non-admin users
  if (!(await isAdmin())) {
    const clientIP = await getClientIPFromHeaders();
    const isAllowed = await checkRateLimit(
      clientIP,
      {
        prefix: `${siteConfig.name.trim()}-submit`,
        maxRequests: parseInt(process.env.NEXT_PUBLIC_DAILY_SUBMIT_LIMIT || "30"),
        window: "1 d",
      },
      RedisFallbackMode.MEMORY_FALLBACK,
    );

    if (!isAllowed) {
      return actionResponse.badRequest(
        `Rate limit exceeded. You can submit/update products up to ${process.env.NEXT_PUBLIC_DAILY_SUBMIT_LIMIT || "30"} times per day.`,
      );
    }
  }

  try {
    const result = await db.transaction(async (tx) => {
      const existingProduct = await tx.query.products.findFirst({
        columns: { id: true, userId: true, slug: true },
        where: eq(productsSchema.id, productId),
      });

      if (!existingProduct) {
        throw new Error("Product not found.");
      }

      if (existingProduct.userId !== user.id) {
        throw new Error("You don't have permission to update this product.");
      }

      const { categoryIds, ...restOfData } = data;

      await tx.update(productsSchema).set(restOfData).where(eq(productsSchema.id, productId));

      const existingCategories = await tx.query.productCategories.findMany({
        columns: { categoryId: true },
        where: eq(productCategories.productId, productId),
      });

      const existingCategoryIds = existingCategories.map((c) => c.categoryId);
      const newCategoryIds = categoryIds;

      const categoriesToAdd = newCategoryIds.filter(
        (id: string) => !existingCategoryIds.includes(id),
      );
      const categoriesToRemove = existingCategoryIds.filter((id) => !newCategoryIds.includes(id));

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
          categoriesToAdd.map((categoryId: string) => ({
            productId: productId,
            categoryId: categoryId,
          })),
        );
      }

      return existingProduct.slug;
    });

    revalidatePath("/");
    revalidatePath(`/sites/${result}`);

    return actionResponse.success();
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    if (errorMessage.includes("Product not found")) {
      return actionResponse.notFound(errorMessage);
    }
    if (errorMessage.includes("permission")) {
      return actionResponse.unauthorized(errorMessage);
    }
    return actionResponse.error(errorMessage);
  }
}

export async function deleteMyProductAction(productId: string): Promise<ActionResult<{}>> {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return actionResponse.unauthorized();
  }

  try {
    const product = await db.query.products.findFirst({
      columns: { id: true, userId: true, status: true },
      where: eq(productsSchema.id, productId),
    });

    if (!product) {
      return actionResponse.notFound("Product not found.");
    }

    if (product.userId !== user.id) {
      return actionResponse.unauthorized("You don't have permission to delete this product.");
    }

    // Users can only delete their own pending_review products
    // Live products must be handled by admin
    if (product.status === "live") {
      return actionResponse.badRequest("Live products cannot be deleted. Please contact support.");
    }

    await db.delete(productsSchema).where(eq(productsSchema.id, productId));

    revalidatePath("/");

    return actionResponse.success();
  } catch (err) {
    return actionResponse.error(getErrorMessage(err));
  }
}

/**
 * Get product by slug for public viewing
 */
export async function getProductBySlug(slug: string): Promise<
  ActionResult<
    ProductWithCategories & {
      user: {
        id: string;
        name: string | null;
        image: string | null;
        email: string;
      };
    }
  >
> {
  try {
    const product = await db.query.products.findFirst({
      where: and(
        eq(productsSchema.slug, slug),
        inArray(productsSchema.status, ["live", "pending_review"]), // Only valid enum values in DB
      ),
      with: {
        productCategories: {
          with: {
            category: true,
          },
        },
        user: {
          columns: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      return actionResponse.notFound("Product not found.");
    }

    const transformedProduct = {
      ...product,
      categories: product.productCategories.map((pc) => pc.category),
    };

    return actionResponse.success(transformedProduct as any);
  } catch (err) {
    return actionResponse.error(getErrorMessage(err));
  }
}

/**
 * Get all product slugs for static generation
 */
export async function getAllProductSlugs(): Promise<ActionResult<{ slugs: string[] }>> {
  try {
    const productData = await db
      .select({ slug: productsSchema.slug })
      .from(productsSchema)
      .where(eq(productsSchema.status, "live")); // Only 'live' products for static generation

    const slugs = (productData?.map((product) => product.slug).filter(Boolean) as string[]) || [];
    return actionResponse.success({ slugs });
  } catch (err) {
    return actionResponse.error(getErrorMessage(err));
  }
}

/**
 * Get related products by categories (excluding current product)
 */
export async function getRelatedProducts(
  productId: string,
  categoryIds: string[],
  limit: number = 6,
): Promise<ActionResult<{ products: ProductWithCategories[] }>> {
  try {
    if (categoryIds.length === 0) {
      return actionResponse.success({ products: [] });
    }

    const subquery = db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(
        and(
          inArray(productCategories.categoryId, categoryIds),
          ne(productCategories.productId, productId),
        ),
      )
      .groupBy(productCategories.productId) // Ensure distinct product IDs
      .limit(limit * 2); // Fetch more to randomize from a larger pool if needed

    const relatedProducts = await db.query.products.findMany({
      where: and(
        inArray(productsSchema.id, subquery),
        inArray(productsSchema.status, ["live"]), // Only show live products
      ),
      with: {
        productCategories: {
          with: {
            category: true,
          },
        },
      },
      orderBy: [desc(productsSchema.isFeatured), desc(productsSchema.submittedAt)],
      limit: limit,
    });

    if (!relatedProducts) {
      return actionResponse.success({ products: [] });
    }

    const productsData = relatedProducts.map((p) => ({
      ...p,
      categories: p.productCategories.map((pc) => pc.category),
    }));

    return actionResponse.success({
      products: (productsData as unknown as ProductWithCategories[]) || [],
    });
  } catch (err) {
    return actionResponse.error(getErrorMessage(err));
  }
}

/**
 * Get live products count
 */
export async function getLiveProductsCount(): Promise<ActionResult<number>> {
  try {
    const result = await db
      .select({ value: count() })
      .from(productsSchema)
      .where(eq(productsSchema.status, "live"));

    return actionResponse.success(result[0].value ?? 0);
  } catch (err) {
    return actionResponse.error(getErrorMessage(err));
  }
}
