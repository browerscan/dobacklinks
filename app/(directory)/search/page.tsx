import { LatestProductCard } from "@/components/products/LatestProductCard";
import { ProductsSkeleton } from "@/components/products/ProductsSkeleton";
import { SearchInput } from "@/components/search/SearchInput";
import { SearchTracker } from "@/components/search/SearchTracker";
import { AdvancedFilters } from "@/components/search/AdvancedFilters";
import { GatedSearch } from "@/components/search/GatedSearch";
import { ExportButton } from "@/components/export/ExportButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { constructMetadata } from "@/lib/metadata";
import { getSession } from "@/lib/auth/server";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

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
      minDr?: number;
      maxDr?: number;
      minDa?: number;
      maxDa?: number;
    };
  };
  error?: string;
}

async function searchProducts(
  searchParams: URLSearchParams,
): Promise<SearchResponse> {
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
  // Check if user is logged in
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  // If not logged in, show gated search page
  if (!isLoggedIn) {
    return <GatedSearch />;
  }

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
      {query && (
        <SearchTracker
          searchTerm={query}
          resultsCount={pagination?.total || 0}
        />
      )}

      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          {query ? `Search Results for "${query}"` : "Search Guest Post Sites"}
        </h1>
        <SearchInput defaultValue={query} className="max-w-2xl" />
      </div>

      {/* Main Content with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <AdvancedFilters />
        </aside>

        {/* Results */}
        <div className="lg:col-span-3">
          {!result.success ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-destructive">
                  Search failed. Please try again.
                </p>
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
              {/* Results Count & Export Button */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-muted-foreground">
                  Showing {(page - 1) * (pagination?.limit || 20) + 1}-
                  {Math.min(
                    page * (pagination?.limit || 20),
                    pagination?.total || 0,
                  )}{" "}
                  of {pagination?.total || 0} results
                </p>
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
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {mappedProducts.map((product) => (
                  <LatestProductCard
                    key={product.id}
                    product={product as any}
                  />
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
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.totalPages}
                    >
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
