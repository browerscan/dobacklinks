import { siteConfig } from "@/config/site";
import { Metadata } from "next";

type MetadataProps = {
  page?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  images?: string[];
  noIndex?: boolean;
  path?: string;
  canonicalUrl?: string;
  useDefaultOgImage?: boolean;
};

// Default keywords for the site
const defaultKeywords = [
  "guest post",
  "guest posting sites",
  "backlinks",
  "link building",
  "DR",
  "domain rating",
  "DA",
  "domain authority",
  "SEO",
  "outreach",
  "guest blogging",
  "content marketing",
  "sponsored posts",
  "dofollow links",
];

export async function constructMetadata({
  title,
  description,
  keywords = [],
  images = [],
  noIndex = false,
  path,
  canonicalUrl,
  useDefaultOgImage = true,
}: MetadataProps): Promise<Metadata> {
  const pageTitle = title || siteConfig.name;
  const pageDescription = description || siteConfig.description;

  const finalTitle =
    path === "/" ? `${pageTitle} - ${siteConfig.tagLine}` : `${pageTitle} | ${siteConfig.name}`;

  canonicalUrl = canonicalUrl || path;

  // Open Graph
  const imageUrls =
    images.length > 0
      ? images.map((img) => ({
          url: img.startsWith("http") ? img : `${siteConfig.url}/${img}`,
          alt: pageTitle,
          type: img.endsWith(".webp") ? "image/webp" : undefined,
        }))
      : useDefaultOgImage
        ? [
            {
              url: `${siteConfig.url}/og.webp`,
              alt: pageTitle,
              type: "image/webp",
            },
          ]
        : undefined;
  const pageURL = path;

  // Merge custom keywords with defaults, removing duplicates
  const mergedKeywords = [...new Set([...keywords, ...defaultKeywords])];

  return {
    title: finalTitle,
    description: pageDescription,
    keywords: mergedKeywords,
    authors: siteConfig.authors,
    creator: siteConfig.creator,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: canonicalUrl
        ? `${siteConfig.url}${canonicalUrl === "/" ? "" : canonicalUrl}`
        : undefined,
    },
    // Create an OG image using https://myogimage.com/
    openGraph: {
      type: "website",
      title: finalTitle,
      description: pageDescription,
      url: pageURL,
      siteName: siteConfig.name,
      ...(imageUrls && { images: imageUrls }),
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: pageDescription,
      site: `${siteConfig.url}${pageURL === "/" ? "" : pageURL}`,
      ...(imageUrls && { images: imageUrls }),
      creator: siteConfig.creator,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
      },
    },
  };
}
