import { getCategoryBySlug } from "@/actions/categories/user";
import {
  getFeaturedProducts,
  getLatestProducts,
} from "@/actions/products/user";
import { ContentHeader } from "@/app/(directory)/ContentHeader";
import { FeaturedProductsList } from "@/components/products/FeaturedProductsList";
import { LatestProductsList } from "@/components/products/LatestProductsList";
import { ProductsSkeleton } from "@/components/products/ProductsSkeleton";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const runtime = "nodejs";
export const revalidate = 600; // 10 minutes

type PageParams = Promise<{ slug: string }>;

type MetadataProps = {
  params: PageParams;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { slug } = await params;

  const categoryResponse = await getCategoryBySlug(slug);
  const category = categoryResponse.success ? categoryResponse.data : null;

  const title = category
    ? `Best ${category.name} Guest Post Sites`
    : "Category Sites";
  const description = category
    ? `Explore ${category.name.toLowerCase()} guest post opportunities with DR, traffic, and pricing details.`
    : "Discover guest post sites tailored to your niche.";

  return constructMetadata({
    page: "Category",
    title,
    description,
    path: `/categories/${slug}`,
  });
}

async function Products({ categoryId }: { categoryId: string }) {
  const [featuredResponse, latestResponse] = await Promise.all([
    getFeaturedProducts({ categoryId }),
    getLatestProducts({
      pageIndex: 0,
      categoryId,
    }),
  ]);

  const featuredProducts = featuredResponse.success
    ? (featuredResponse.data?.products ?? [])
    : [];

  const latestProducts = latestResponse.success
    ? (latestResponse.data?.products ?? [])
    : [];
  const latestTotalCount = latestResponse.success
    ? (latestResponse.data?.count ?? 0)
    : 0;

  return (
    <>
      <FeaturedProductsList products={featuredProducts} />
      <LatestProductsList
        initialProducts={latestProducts}
        totalCount={latestTotalCount}
        categoryId={categoryId}
      />
    </>
  );
}

interface CategoryPageProps {
  params: PageParams;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const categoryResponse = await getCategoryBySlug(slug);

  if (!categoryResponse.success || !categoryResponse.data) {
    notFound();
  }

  const category = categoryResponse.data;

  const title = `Best ${category.name} Guest Post Sites`;
  const description = `Curated ${category.name.toLowerCase()} publishers that accept guest posts. Compare DR, traffic, price, and link type to pitch smarter.`;

  return (
    <div className="p-4">
      <ContentHeader title={title} description={description} />
      <Suspense fallback={<ProductsSkeleton />}>
        <Products categoryId={category.id} />
      </Suspense>
    </div>
  );
}
