import {
  getFeaturedProducts,
  getProductBySlug,
  getRelatedProducts,
} from "@/actions/products/user";
import { ProductDetailContent } from "@/app/(basic-layout)/product/[slug]/ProductDetailContent";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamicParams = true;
export const revalidate = 3600; // Revalidate every hour

type Params = Promise<{
  slug: string;
}>;

type MetadataProps = {
  params: Params;
};
// Generate static params for top 100 popular products
export async function generateStaticParams() {
  try {
    const topProducts = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.status, "live"))
      .orderBy(desc(products.monthlyVisits))
      .limit(100);

    return topProducts.map((product) => ({
      slug: product.slug,
    }));
  } catch (error) {
    console.error("[generateStaticParams] Error:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);

  if (!result.success || !result.data) {
    return constructMetadata({
      title: "404",
      description: "Site not found",
      noIndex: true,
      path: `/sites/${slug}`,
    });
  }

  const product = result.data;
  const fullPath = `/sites/${slug}`;

  // Build enhanced SEO description with metrics
  const descriptionParts = [product.tagline];
  if (product.dr) descriptionParts.push(`DR ${product.dr}`);
  if (product.da) descriptionParts.push(`DA ${product.da}`);
  if (product.niche) descriptionParts.push(`Niche: ${product.niche}`);
  if (product.linkType === "dofollow") descriptionParts.push("Dofollow links");
  if (product.googleNews) descriptionParts.push("Google News approved");

  const enhancedDescription = descriptionParts.filter(Boolean).join(" | ");

  // Build page-specific keywords
  const pageKeywords = [
    product.name,
    `${product.name} guest post`,
    product.niche,
    product.linkType,
  ].filter(Boolean) as string[];

  return constructMetadata({
    title: `${product.name} - Guest Post Site`,
    description: enhancedDescription,
    keywords: pageKeywords,
    path: fullPath,
    useDefaultOgImage: false,
  });
}

export default async function SitePage({ params }: { params: Params }) {
  const { slug } = await params;
  const result = await getProductBySlug(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const product = result.data;

  const categoryIds = product.categories.map((cat) => cat.id);
  const [relatedResult, featuredResult] = await Promise.all([
    getRelatedProducts(product.id, categoryIds, 10),
    getFeaturedProducts({ pageSize: 6 }),
  ]);

  const relatedProducts =
    relatedResult.success && relatedResult.data
      ? relatedResult.data.products
      : [];

  const featuredProducts =
    featuredResult.success && featuredResult.data
      ? featuredResult.data.products
      : [];

  return (
    <ProductDetailContent
      product={product}
      relatedProducts={relatedProducts}
      featuredProducts={featuredProducts}
    />
  );
}
