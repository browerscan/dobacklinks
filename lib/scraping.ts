export interface ScrapingResult {
  data?: any;
  metadata?: any;
  formats?: any;
}

// Timeout for Firecrawl API (30 seconds)
const SCRAPE_TIMEOUT = 30000;

export async function scrapeWebsite(url: string): Promise<ScrapingResult> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error("Firecrawl API key not configured");
  }

  const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: [
        "markdown",
        {
          type: "json",
          prompt:
            "Extract comprehensive product information from this website including title, description, features, pricing details, company info, platforms, social links, and other relevant product data.",
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              features: { type: "array", items: { type: "string" } },
              pricing: {
                type: "object",
                properties: {
                  model: {
                    type: "string",
                    description: "Free, Freemium, or Paid",
                  },
                  details: {
                    type: "string",
                    description:
                      "Specific pricing information like '$9/month' or 'Free with premium options'",
                  },
                  freeTier: {
                    type: "boolean",
                    description: "Whether there's a free tier available",
                  },
                  trialAvailable: {
                    type: "boolean",
                    description: "Whether there's a free trial",
                  },
                  startingPrice: {
                    type: "string",
                    description: "Starting price if paid",
                  },
                },
              },
              screenshots: { type: "array", items: { type: "string" } },
              logo: { type: "string" },
              company: { type: "string" },
              platforms: { type: "array", items: { type: "string" } },
              category: { type: "string" },
              tagline: { type: "string" },
              productName: { type: "string" },
              mainFunctionality: { type: "string" },
              targetAudience: { type: "string" },
              businessType: {
                type: "string",
                description: "Type of business: SaaS, tool, app, service, etc.",
              },
              isOpenSource: {
                type: "boolean",
                description: "Whether the product is open source",
              },
              social: {
                type: "object",
                properties: {
                  linkedin: { type: "string" },
                  facebook: { type: "string" },
                  github: { type: "string" },
                  twitter: { type: "string" },
                },
              },
            },
          },
        },
      ],
      includeTags: ["title", "meta", "img"],
    }),
    signal: AbortSignal.timeout(SCRAPE_TIMEOUT),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Firecrawl API error: ${error}`);
  }

  return await response.json();
}

export async function getFaviconUrl(url: string): Promise<string | null> {
  try {
    const domain = new URL(url).hostname;
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    const response = await fetch(faviconUrl, { method: "HEAD" });
    if (response.ok) {
      return faviconUrl;
    }
    return null;
  } catch {
    return null;
  }
}
