import { LatestProductCard } from "@/components/products/LatestProductCard";
import { SearchInput } from "@/components/search/SearchInput";
import { SearchTracker } from "@/components/search/SearchTracker";
import { AdvancedFilters } from "@/components/search/AdvancedFilters";
import { BasicFilters } from "@/components/search/BasicFilters";
import { ExportButton } from "@/components/export/ExportButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { constructMetadata } from "@/lib/metadata";
import { getSession } from "@/lib/auth/server";
import { ChevronLeft, ChevronRight, Search, Lock, Sliders } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";

  return constructMetadata({
    title: query ? `Search: ${query}` : "Search Guest Post Sites",
    description: query
      ? `Search results for "${query}" - Find guest post opportunities matching your criteria.`
      : "Search our directory of 9,700+ guest post sites by name, niche, DR, DA, and more.",
    path: `/search${query ? `?q=${encodeURIComponent(query)}` : ""}`,
    // Prevent search result pages from being indexed to avoid duplicate content issues
    noIndex: true,
  });
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  url: string;
  logoUrl: string | null;
  niche: string | null;
  dr: number | null;
  da: number | null;
  monthlyVisits: number | null;
  linkType: string | null;
  googleNews: boolean | null;
  isFeatured: boolean | null;
  isVerified: boolean | null;
}

interface SearchResponse {
  success: boolean;
  data?: {
    results: SearchResult[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    query: string;
    filters: {
      niche?: string;
      linkType?: string;
      minDr?: number;
      maxDr?: number;
      minDa?: number;
      maxDa?: number;
      minTraffic?: number;
      maxTraffic?: number;
      maxSpamScore?: number;
      googleNews?: boolean;
      featured?: boolean;
      verified?: boolean;
    };
  };
  error?: string;
}

async function searchProducts(searchParams: URLSearchParams): Promise<SearchResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/search?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
    });
    return response.json();
  } catch (error) {
    console.error("[Search Page] Error:", error);
    return { success: false, error: "Search failed" };
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  const params = await searchParams;
  const urlParams = new URLSearchParams();

  // Transfer all search params
  Object.entries(params).forEach(([key, value]) => {
    if (value && typeof value === "string") {
      urlParams.set(key, value);
    }
  });

  const query = (params.q as string) || "";
  const page = parseInt((params.page as string) || "1");

  const result = await searchProducts(urlParams);

  const data = result.success ? result.data : null;
  const products = data?.results || [];
  const pagination = data?.pagination;

  // Map to ProductWithCategories format for card component
  const mappedProducts = products.map((p) => ({
    ...p,
    categories: [],
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Track search event */}
      {query && <SearchTracker searchTerm={query} resultsCount={pagination?.total || 0} />}

      {/* Search Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {query ? `Search Results for "${query}"` : "Search Guest Post Sites"}
            </h1>
            {pagination && pagination.total > 0 && (
              <p className="text-muted-foreground">
                Found{" "}
                <span className="font-semibold text-foreground">
                  {pagination.total.toLocaleString()}
                </span>{" "}
                sites
                {!isLoggedIn && (
                  <Badge variant="outline" className="ml-2">
                    <Lock className="w-3 h-3 mr-1" />
                    Sign in for pricing
                  </Badge>
                )}
              </p>
            )}
          </div>
          {isLoggedIn && products.length > 0 && (
            <ExportButton
              data={products.map((p) => ({
                name: p.name,
                url: p.url,
                niche: p.niche,
                dr: p.dr,
                da: p.da,
                monthlyVisits: p.monthlyVisits,
                linkType: p.linkType,
                googleNews: p.googleNews ? "Yes" : "No",
              }))}
              filename={`search_results_${query || "all"}_${new Date().toISOString().split("T")[0]}.csv`}
            />
          )}
        </div>
        <SearchInput defaultValue={query} className="max-w-2xl" />
      </div>

      {/* Main Content with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          {isLoggedIn ? <AdvancedFilters /> : <BasicFilters />}

          {/* Upgrade Prompt for Non-Logged Users */}
          {!isLoggedIn && (
            <Card className="mt-4 border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Sliders className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold text-sm">Unlock Advanced Filters</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5 ml-7">
                  <li>Custom DR/DA range sliders</li>
                  <li>Minimum traffic filtering</li>
                  <li>Spam score thresholds</li>
                  <li>Export results to CSV</li>
                  <li className="text-primary font-medium">View pricing & contact info</li>
                </ul>
                <Button asChild className="w-full" size="sm">
                  <Link href="/login?returnUrl=/search">Sign In Free</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </aside>

        {/* Results */}
        <div className="lg:col-span-3">
          {!result.success ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-destructive">Search failed. Please try again.</p>
              </CardContent>
            </Card>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No results found</h2>
                <p className="text-muted-foreground mb-4">
                  {query
                    ? `We couldn't find any sites matching "${query}".`
                    : "Enter a search term to find guest post sites."}
                </p>
                <Link href="/">
                  <Button variant="outline">Browse All Sites</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {mappedProducts.map((product) => (
                  <LatestProductCard key={product.id} product={product as any} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Link
                    href={`/search?${new URLSearchParams({
                      ...Object.fromEntries(urlParams),
                      page: String(Math.max(1, page - 1)),
                    }).toString()}`}
                  >
                    <Button variant="outline" size="sm" disabled={page <= 1}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                  </Link>

                  <span className="text-sm text-muted-foreground px-4">
                    Page {page} of {pagination.totalPages}
                  </span>

                  <Link
                    href={`/search?${new URLSearchParams({
                      ...Object.fromEntries(urlParams),
                      page: String(Math.min(pagination.totalPages, page + 1)),
                    }).toString()}`}
                  >
                    <Button variant="outline" size="sm" disabled={page >= pagination.totalPages}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
