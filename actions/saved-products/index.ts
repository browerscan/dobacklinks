"use server";

import { actionResponse, type ActionResult } from "@/lib/action-response";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { savedProducts, products, categories, productCategories } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { and, asc, desc, eq, exists } from "drizzle-orm";

export type SavedProductWithDetails = {
  id: string;
  productId: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    tagline: string | null;
    logoUrl: string | null;
    url: string;
    niche: string | null;
    dr: number | null;
    da: number | null;
    monthlyVisits: number | null;
    traffic: string | null;
    linkType: string | null;
    priceRange: string | null;
    googleNews: boolean | null;
    status: string;
    screenshotThumbnailUrl: string | null;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  }>;
};

/**
 * Toggle save/unsave a product for the current user
 */
export async function toggleSaveProductAction(
  productId: string,
): Promise<ActionResult<{ saved: boolean; message?: string }>> {
  try {
    const session = await getSession();
    const authUser = session?.user;

    if (!authUser) {
      return actionResponse.unauthorized("You must be logged in to save products.");
    }

    // Check if product exists
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      return actionResponse.notFound("Product not found.");
    }

    // Check if already saved
    const existingSave = await db.query.savedProducts.findFirst({
      where: and(eq(savedProducts.userId, authUser.id), eq(savedProducts.productId, productId)),
    });

    if (existingSave) {
      // Unsave the product
      await db
        .delete(savedProducts)
        .where(and(eq(savedProducts.userId, authUser.id), eq(savedProducts.productId, productId)));

      return actionResponse.success({
        saved: false,
        message: "Product removed from saved items.",
      });
    } else {
      // Save the product
      await db.insert(savedProducts).values({
        userId: authUser.id,
        productId: productId,
      });

      return actionResponse.success({
        saved: true,
        message: "Product saved successfully.",
      });
    }
  } catch (error) {
    console.error("Toggle save product error:", error);
    const errorMessage = getErrorMessage(error);
    return actionResponse.error(errorMessage || "Failed to save product.");
  }
}

/**
 * Get all saved products for the current user with pagination
 */
export async function getSavedProductsAction(
  options: { pageIndex?: number; pageSize?: number } = {},
): Promise<
  ActionResult<{
    products: SavedProductWithDetails[];
    count: number;
    hasMore: boolean;
  }>
> {
  try {
    const session = await getSession();
    const authUser = session?.user;

    if (!authUser) {
      return actionResponse.unauthorized("You must be logged in to view saved products.");
    }

    const pageIndex = options.pageIndex ?? 0;
    const pageSize = options.pageSize ?? 12;
    const offset = pageIndex * pageSize;

    // Get total count
    const countResult = await db
      .select({ count: savedProducts.id })
      .from(savedProducts)
      .where(eq(savedProducts.userId, authUser.id));

    const totalCount = countResult.length;

    // Get saved products with details
    const savedProductsData = await db.query.savedProducts.findMany({
      where: eq(savedProducts.userId, authUser.id),
      with: {
        product: {
          with: {
            productCategories: {
              with: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: [desc(savedProducts.createdAt)],
      limit: pageSize,
      offset,
    });

    // Transform data to match expected format
    const transformedProducts: SavedProductWithDetails[] = savedProductsData
      .filter((sp) => sp.product !== null)
      .map((sp) => ({
        id: sp.id,
        productId: sp.productId,
        createdAt: sp.createdAt,
        product: {
          id: sp.product.id,
          name: sp.product.name,
          slug: sp.product.slug,
          tagline: sp.product.tagline,
          logoUrl: sp.product.logoUrl,
          url: sp.product.url,
          niche: sp.product.niche,
          dr: sp.product.dr,
          da: sp.product.da,
          monthlyVisits: sp.product.monthlyVisits,
          traffic: sp.product.traffic,
          linkType: sp.product.linkType,
          priceRange: sp.product.priceRange,
          googleNews: sp.product.googleNews,
          status: sp.product.status,
          screenshotThumbnailUrl: sp.product.screenshotThumbnailUrl,
        },
        categories: sp.product.productCategories.map((pc) => ({
          id: pc.category.id,
          name: pc.category.name,
          slug: pc.category.slug,
          icon: pc.category.icon,
        })),
      }));

    return actionResponse.success({
      products: transformedProducts,
      count: totalCount,
      hasMore: offset + savedProductsData.length < totalCount,
    });
  } catch (error) {
    console.error("Get saved products error:", error);
    const errorMessage = getErrorMessage(error);
    return actionResponse.error(errorMessage || "Failed to fetch saved products.");
  }
}

/**
 * Check if a product is saved by the current user
 */
export async function isProductSavedAction(
  productId: string,
): Promise<ActionResult<{ saved: boolean }>> {
  try {
    const session = await getSession();
    const authUser = session?.user;

    if (!authUser) {
      return actionResponse.success({ saved: false });
    }

    const savedProduct = await db.query.savedProducts.findFirst({
      where: and(eq(savedProducts.userId, authUser.id), eq(savedProducts.productId, productId)),
    });

    return actionResponse.success({
      saved: !!savedProduct,
    });
  } catch (error) {
    console.error("Check product saved error:", error);
    const errorMessage = getErrorMessage(error);
    return actionResponse.error(errorMessage || "Failed to check saved status.");
  }
}

/**
 * Get saved status for multiple products at once
 * Useful for product listing pages
 */
export async function getProductsSavedStatusAction(
  productIds: string[],
): Promise<ActionResult<{ savedStatus: Record<string, boolean> }>> {
  try {
    const session = await getSession();
    const authUser = session?.user;

    if (!authUser) {
      return actionResponse.success({ savedStatus: {} });
    }

    const savedProductsList = await db.query.savedProducts.findMany({
      where: and(eq(savedProducts.userId, authUser.id)),
    });

    const savedStatus: Record<string, boolean> = {};
    productIds.forEach((id) => {
      savedStatus[id] = savedProductsList.some((sp) => sp.productId === id);
    });

    return actionResponse.success({ savedStatus });
  } catch (error) {
    console.error("Get products saved status error:", error);
    const errorMessage = getErrorMessage(error);
    return actionResponse.error(errorMessage || "Failed to check saved status.");
  }
}

/**
 * Remove a product from saved items
 */
export async function removeSavedProductAction(productId: string) {
  try {
    const session = await getSession();
    const authUser = session?.user;

    if (!authUser) {
      return actionResponse.unauthorized("You must be logged in to manage saved products.");
    }

    await db
      .delete(savedProducts)
      .where(and(eq(savedProducts.userId, authUser.id), eq(savedProducts.productId, productId)));

    return actionResponse.success({
      message: "Product removed from saved items.",
    });
  } catch (error) {
    console.error("Remove saved product error:", error);
    const errorMessage = getErrorMessage(error);
    return actionResponse.error(errorMessage || "Failed to remove saved product.");
  }
}

/**
 * Clear all saved products for the current user
 */
export async function clearAllSavedProductsAction() {
  try {
    const session = await getSession();
    const authUser = session?.user;

    if (!authUser) {
      return actionResponse.unauthorized("You must be logged in to manage saved products.");
    }

    await db.delete(savedProducts).where(eq(savedProducts.userId, authUser.id));

    return actionResponse.success({
      message: "All saved products cleared.",
    });
  } catch (error) {
    console.error("Clear saved products error:", error);
    const errorMessage = getErrorMessage(error);
    return actionResponse.error(errorMessage || "Failed to clear saved products.");
  }
}
