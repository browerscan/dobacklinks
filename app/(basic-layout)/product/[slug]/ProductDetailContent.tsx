import ProductMDXComponents from "@/components/mdx/ProductMDXComponents";
import { FeaturedProductCard } from "@/components/products/FeaturedProductCard";
import { LatestProductCard } from "@/components/products/LatestProductCard";
import { PublicSiteData } from "@/components/products/PublicSiteData";
import { PrivateSiteData } from "@/components/products/PrivateSiteData";
import { GatedPricing } from "@/components/products/GatedPricing";
import { SimilarWebMetrics } from "@/components/products/SimilarWebMetrics";
import { ScreenshotDisplay } from "@/components/products/ScreenshotDisplay";
import { SearchEngineLinks } from "@/components/products/SearchEngineLinks";
import { QuickLinks } from "@/components/products/QuickLinks";
import { HireMeCTA } from "@/components/cta/HireMeCTA";
import { ImagePreview } from "@/components/shared/ImagePreview";
import { ProductViewTracker } from "@/components/analytics/ProductViewTracker";
import { QualityScoreBadge } from "@/components/products/QualityScoreBadge";
import { DomainInfoCard } from "@/components/products/DomainInfoCard";
import { ValueForMoneyIndicator } from "@/components/products/ValueForMoneyIndicator";
import { EnhancedSampleUrls } from "@/components/products/EnhancedSampleUrls";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Category, ProductWithCategories } from "@/types/product";
import { getSession } from "@/lib/auth/server";
import dayjs from "dayjs";
import { Crown, ExternalLink, Mail, Star } from "lucide-react";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import remarkGfm from "remark-gfm";
import { siteConfig } from "@/config/site";

const options = {
  parseFrontmatter: true,
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
};

interface ProductDetailContentProps {
  product: ProductWithCategories & {
    user: {
      id: string;
      name: string | null;
      image: string | null;
      email: string;
    };
  };
  relatedProducts: ProductWithCategories[];
  featuredProducts: ProductWithCategories[];
}

export async function ProductDetailContent({
  product,
  relatedProducts,
  featuredProducts,
}: ProductDetailContentProps) {
  // Get authenticated user session
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  // Enhanced structured data for guest post sites
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline || `Guest post opportunity on ${product.name}`,
    url: product.url,
    category: product.niche || "Guest Post Site",
    brand: {
      "@type": "Organization",
      name: product.name,
      url: product.url,
    },
    ...(product.priceRange && {
      offers: {
        "@type": "Offer",
        priceSpecification: {
          "@type": "PriceSpecification",
          price: product.priceRange,
        },
        availability: "https://schema.org/InStock",
      },
    }),
    additionalProperty: [
      ...(product.dr
        ? [
            {
              "@type": "PropertyValue",
              name: "Domain Rating (DR)",
              value: product.dr.toString(),
            },
          ]
        : []),
      ...(product.da
        ? [
            {
              "@type": "PropertyValue",
              name: "Domain Authority (DA)",
              value: product.da.toString(),
            },
          ]
        : []),
      ...(product.linkType
        ? [
            {
              "@type": "PropertyValue",
              name: "Link Type",
              value: product.linkType,
            },
          ]
        : []),
      ...(product.googleNews
        ? [
            {
              "@type": "PropertyValue",
              name: "Google News Approved",
              value: "Yes",
            },
          ]
        : []),
    ],
  };

  // BreadcrumbList structured data
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteConfig.url,
    },
  ];

  if (product.categories.length > 0) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: product.categories[0].name,
      item: `${siteConfig.url}/categories/${product.categories[0].slug}`,
    });
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: product.name,
      item: `${siteConfig.url}/sites/${product.slug}`,
    });
  } else {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: product.name,
      item: `${siteConfig.url}/sites/${product.slug}`,
    });
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <>
      <ProductViewTracker
        productId={product.id}
        productName={product.name}
        productCategory={product.niche || undefined}
        productDR={product.dr || undefined}
      />

      <Script
        id="site-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" title="Home">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {product.categories.length > 0 && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        href={`/categories/${product.categories[0].slug}`}
                        title={product.categories[0].name}
                      >
                        {product.categories[0].name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Main Layout: 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-4">
            {/* Left Column (60%) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Public Site Data - Always visible */}
              <PublicSiteData product={product} />

              {/* Screenshot Preview */}
              {product.screenshotFullUrl && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Website Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScreenshotDisplay
                      screenshotUrl={product.screenshotFullUrl}
                      thumbnailUrl={product.screenshotThumbnailUrl}
                      name={product.name}
                    />
                    {product.screenshotCapturedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Screenshot captured:{" "}
                        {dayjs(product.screenshotCapturedAt).format(
                          "MMM D, YYYY",
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Search Engine Index Links */}
              {product.url && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      Search Engine Index
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SearchEngineLinks
                      hostname={new URL(product.url).hostname}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Quick Links */}
              {product.url && (
                <QuickLinks
                  url={product.url}
                  hostname={new URL(product.url).hostname}
                />
              )}

              {/* Screenshots/Images */}
              {product.appImages && product.appImages.length > 0 && (
                <div className="rounded-lg border p-2">
                  <Carousel>
                    <CarouselContent>
                      {product.appImages.map((image: string) => (
                        <CarouselItem key={image}>
                          <div className="w-full aspect-[16/9] overflow-hidden rounded-lg flex items-center justify-center bg-gray-50">
                            <ImagePreview>
                              <Image
                                src={image}
                                alt={product.name}
                                width={1280}
                                height={630}
                                className="rounded-lg max-h-full max-w-full object-contain"
                              />
                            </ImagePreview>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {product.appImages.length > 1 && (
                      <>
                        <CarouselPrevious className="left-0" />
                        <CarouselNext className="right-0" />
                      </>
                    )}
                  </Carousel>
                </div>
              )}

              {/* Description/Guidelines */}
              {product.description && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">
                    Guidelines & Notes
                  </h2>
                  <article className="prose prose-gray dark:prose-invert max-w-none">
                    <MDXRemote
                      source={product.description}
                      components={ProductMDXComponents}
                      options={options}
                    />
                  </article>
                </div>
              )}

              {/* Private Data (Logged-in) or Gated Pricing (Public) */}
              {isLoggedIn ? (
                <PrivateSiteData product={product} />
              ) : (
                <GatedPricing />
              )}

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <section>
                    <h2 className="text-2xl font-semibold mb-4">
                      Similar sites
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {relatedProducts.map((relatedProduct) => (
                        <LatestProductCard
                          key={relatedProduct.id}
                          product={relatedProduct}
                        />
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* Right Sidebar (40%) */}
            <div className="space-y-6">
              {/* SimilarWeb Traffic Metrics */}
              <SimilarWebMetrics product={product} />

              {/* Quality Score Badge */}
              <QualityScoreBadge product={product} />

              {/* Domain Information Card */}
              <DomainInfoCard product={product} />

              {/* Hire Me CTA */}
              <HireMeCTA
                variant="sidebar"
                title="Need Help with Outreach?"
                description="Let me handle the guest posting for you. Personal service, proven results."
                ctaText="Hire Me"
              />

              {/* Featured Products */}
              {featuredProducts.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Featured Sites</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {featuredProducts.map((fp) => (
                      <FeaturedProductCard key={fp.slug} product={fp} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer: Listing Date */}
          <div className="text-xs text-muted-foreground mt-6">
            Listed {dayjs(product.submittedAt).format("MMM DD, YYYY")}
          </div>
        </div>
      </div>
    </>
  );
}
