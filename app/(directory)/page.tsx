import { ContentHeader } from "@/app/(directory)/ContentHeader";
import {
  getFeaturedProducts,
  getLatestProducts,
} from "@/actions/products/user";
import { FeaturedProductsList } from "@/components/products/FeaturedProductsList";
import { LatestProductsList } from "@/components/products/LatestProductsList";
import { ProductsSkeleton } from "@/components/products/ProductsSkeleton";
import { HireMeCTA } from "@/components/cta/HireMeCTA";
import { HomePageContent } from "@/app/(directory)/HomePageContent";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { Suspense } from "react";

export const revalidate = 600; // 10 minutes

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    page: "Home",
    description:
      "Curated guest post sites with DR, traffic, price, and link type. Browse niches, shortlist targets, or hire me to publish for you.",
    path: `/`,
  });
}

async function Products() {
  const [featuredResponse, latestResponse] = await Promise.all([
    getFeaturedProducts({ pageSize: 8 }),
    getLatestProducts({ pageIndex: 0 }),
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
      />
    </>
  );
}

export default async function Home() {
  const homeTitle = "Guest Post Sites Directory";
  const homeDescription =
    "9,700+ curated guest post sites with DR, traffic, price, and link type. Browse niches, shortlist targets, or hire me to publish for you.";

  return (
    <div className="p-4">
      <ContentHeader title={homeTitle} description={homeDescription} />
      <Suspense fallback={<ProductsSkeleton />}>
        <Products />
      </Suspense>

      {/* Hire Me CTA after listings */}
      <div className="mt-8 max-w-4xl mx-auto">
        <HireMeCTA
          variant="inline"
          title="Need help with outreach?"
          description="Let me handle the prospecting, outreach, and publication. Personal service, proven results, fast turnaround."
          ctaText="Hire Me"
        />
      </div>

      {/* SEO Content Section */}
      <HomePageContent />
    </div>
  );
}
