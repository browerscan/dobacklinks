import { siteConfig } from "@/config/site";
import type { ProductWithCategories } from "@/types/product";

/**
 * Schema.org structured data generator for product pages
 * Follows Google's structured data guidelines for rich results
 */

interface StructuredDataOptions {
  product: ProductWithCategories;
  isLoggedIn: boolean;
  includePrice?: boolean;
}

/**
 * Generate Organization schema for the website
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    email: "outreach@dobacklinks.com",
    sameAs: [
      // Add social media links if available
    ],
  };
}

/**
 * Generate WebSite schema for search engines
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": {
        "@type": "PropertyValueSpecification",
        valueRequired: true,
        valueName: "search_term_string",
      },
    },
  };
}

/**
 * Extract numeric price from price range string
 * Handles formats like "$100-$200", "100-200", "$150", etc.
 */
function extractMinPrice(priceRange: string | null): number | null {
  if (!priceRange) return null;

  // Extract first numeric value from string
  const match = priceRange.match(/[\d,]+/);
  if (!match) return null;

  // Remove commas and convert to number
  return parseInt(match[0].replace(/,/g, ""), 10);
}

/**
 * Calculate quality score from product metrics
 * Returns a score from 0-100 based on DR, DA, Google News, etc.
 */
function calculateQualityScore(product: ProductWithCategories): number {
  let score = 50; // Base score

  // Domain Rating contribution (up to 25 points)
  if (product.dr) {
    score += Math.min(product.dr * 0.4, 25);
  }

  // Domain Authority contribution (up to 15 points)
  if (product.da) {
    score += Math.min(product.da * 0.2, 15);
  }

  // Google News approved (10 points)
  if (product.googleNews) {
    score += 10;
  }

  // Dofollow link bonus (5 points)
  if (product.linkType === "dofollow") {
    score += 5;
  }

  // Traffic bonus (up to 10 points)
  if (product.monthlyVisits) {
    if (product.monthlyVisits > 1000000) score += 10;
    else if (product.monthlyVisits > 100000) score += 7;
    else if (product.monthlyVisits > 10000) score += 5;
  }

  return Math.min(Math.round(score), 100);
}

/**
 * Generate Product schema with conditional offer data
 * Price information is only included when user is logged in (RBAC)
 */
export function generateProductSchema({
  product,
  isLoggedIn,
  includePrice = true,
}: StructuredDataOptions) {
  const qualityScore = calculateQualityScore(product);

  // Build base product schema
  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline || `Guest post opportunity on ${product.name}`,
    url: `${siteConfig.url}/sites/${product.slug}`,
    category: product.niche || "Guest Post Site",
    brand: {
      "@type": "Organization",
      name: product.name,
      url: product.url,
    },
    // Aggregate rating based on quality metrics
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: qualityScore,
      bestRating: "100",
      worstRating: "0",
      ratingCount: "1",
    },
    // Additional properties as PropertyValue
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Domain Rating",
        value: product.dr ? product.dr.toString() : "N/A",
        unitText: "DR",
      },
      {
        "@type": "PropertyValue",
        name: "Domain Authority",
        value: product.da ? product.da.toString() : "N/A",
        unitText: "DA",
      },
      {
        "@type": "PropertyValue",
        name: "Link Type",
        value: product.linkType || "dofollow",
      },
      {
        "@type": "PropertyValue",
        name: "Google News Approved",
        value: product.googleNews ? "Yes" : "No",
      },
      {
        "@type": "PropertyValue",
        name: "Spam Score",
        value: product.spamScore ? `${product.spamScore}%` : "N/A",
      },
    ],
  };

  // Add SimilarWeb traffic data if available
  if (product.monthlyVisits && product.enrichmentStatus === "enriched") {
    productSchema.additionalProperty = [
      ...(productSchema.additionalProperty as Array<Record<string, unknown>>),
      {
        "@type": "PropertyValue",
        name: "Monthly Visits",
        value: formatNumber(product.monthlyVisits),
      },
    ];

    if (product.globalRank) {
      productSchema.additionalProperty = [
        ...(productSchema.additionalProperty as Array<Record<string, unknown>>),
        {
          "@type": "PropertyValue",
          name: "Global Rank",
          value: `#${product.globalRank}`,
        },
      ];
    }

    if (product.bounceRate) {
      productSchema.additionalProperty = [
        ...(productSchema.additionalProperty as Array<Record<string, unknown>>),
        {
          "@type": "PropertyValue",
          name: "Bounce Rate",
          value: `${Number(product.bounceRate).toFixed(1)}%`,
        },
      ];
    }
  }

  // Add offer with pricing ONLY for logged-in users (RBAC)
  if (isLoggedIn && includePrice && product.priceRange) {
    const minPrice = extractMinPrice(product.priceRange);

    if (minPrice) {
      productSchema.offers = {
        "@type": "Offer",
        name: "Guest Post Placement",
        description: `Get your content published on ${product.name}`,
        price: minPrice.toString(),
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        seller: {
          "@type": "Organization",
          name: product.name,
          url: product.url,
        },
        // Use price range if the string contains a range
        ...(product.priceRange.includes("-") && {
          priceSpecification: {
            "@type": "PriceSpecification",
            priceCurrency: "USD",
            minPrice: minPrice.toString(),
            maxPrice: extractMaxPrice(product.priceRange)?.toString() || minPrice.toString(),
          },
        }),
      };
    }
  }

  // Add sample URLs as offers if available
  if (product.sampleUrls && Array.isArray(product.sampleUrls) && product.sampleUrls.length > 0) {
    const sampleOffers = product.sampleUrls.slice(0, 5).map((url: string) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "CreativeWork",
        name: `Sample post on ${product.name}`,
        url: url,
      },
    }));

    productSchema.hasExample = {
      "@type": "ItemList",
      itemListElement: sampleOffers.map((offer, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: offer,
      })),
    };
  }

  return productSchema;
}

/**
 * Extract max price from price range string
 */
function extractMaxPrice(priceRange: string): number | null {
  if (!priceRange) return null;

  // Find all numeric values
  const matches = priceRange.match(/[\d,]+/g);
  if (!matches || matches.length < 2) return null;

  // Return the last (highest) number
  return parseInt(matches[matches.length - 1].replace(/,/g, ""), 10);
}

/**
 * Format large numbers for display (e.g., 1.2M, 450K)
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(product: ProductWithCategories) {
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteConfig.url,
    },
  ];

  let position = 2;

  // Add category if available
  if (product.categories.length > 0) {
    const category = product.categories[0];
    breadcrumbItems.push({
      "@type": "ListItem",
      position: position++,
      name: category.name,
      item: `${siteConfig.url}/categories/${category.slug}`,
    });
  }

  // Add niche as a virtual category if different from main category
  if (product.niche && product.categories.length > 0) {
    const mainCategory = product.categories[0].name.toLowerCase();
    const niche = product.niche.toLowerCase();
    if (niche !== mainCategory) {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: position++,
        name: product.niche,
        item: `${siteConfig.url}/search?niche=${encodeURIComponent(product.niche)}`,
      });
    }
  }

  // Final item: the product
  breadcrumbItems.push({
    "@type": "ListItem",
    position: position,
    name: product.name,
    item: `${siteConfig.url}/sites/${product.slug}`,
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };
}

/**
 * Generate FAQPage schema for service pages
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Combine all schema types for a product page
 * Returns an array of schema objects to be injected as JSON-LD
 */
export function generateAllSchemasForProduct(
  product: ProductWithCategories,
  isLoggedIn: boolean,
): Array<Record<string, unknown>> {
  return [
    generateOrganizationSchema(),
    generateProductSchema({ product, isLoggedIn }),
    generateBreadcrumbSchema(product),
  ];
}

/**
 * Validate schema object against basic requirements
 */
export function validateSchema(schema: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!schema["@context"]) {
    errors.push("Missing @context property");
  }

  if (!schema["@type"]) {
    errors.push("Missing @type property");
  }

  if (schema["@type"] === "Product") {
    if (!schema["name"]) {
      errors.push("Product schema missing name property");
    }
    if (!schema["description"]) {
      errors.push("Product schema missing description property");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
