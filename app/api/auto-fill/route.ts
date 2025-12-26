export const maxDuration = 120;

import { getActiveCategories } from "@/actions/categories/user";
import { siteConfig } from "@/config/site";
import { apiResponse } from "@/lib/api-response";
import { getSession, isAdmin } from "@/lib/auth/server";
import { getErrorMessage } from "@/lib/error-utils";
import { downloadAndUploadImage } from "@/lib/image-processing";
import { getFaviconUrl, scrapeWebsite } from "@/lib/scraping";
import { checkRateLimit, getClientIPFromRequest, RedisFallbackMode } from "@/lib/upstash";
import { validateUrl } from "@/lib/url";
import { type Product } from "@/types/product";
import { z } from "zod";
import { generateProductInfo } from "./ai-product-generator";

const inputSchema = z.object({
  url: z.string().url("Invalid URL"),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const isAdminUser = session && (await isAdmin());

    if (!session || !isAdminUser) {
      const clientIP = getClientIPFromRequest(req);
      const isAllowed = await checkRateLimit(
        clientIP,
        {
          prefix: `${siteConfig.name.trim()}-auto-fill`,
          maxRequests: parseInt(process.env.NEXT_PUBLIC_DAILY_AI_AUTO_FILL_LIMIT || "30"),
          window: "1 d",
        },
        RedisFallbackMode.MEMORY_FALLBACK,
      );

      if (!isAllowed) {
        return apiResponse.badRequest(
          `Rate limit exceeded. You can use auto-fill up to ${process.env.NEXT_PUBLIC_DAILY_AI_AUTO_FILL_LIMIT} times per day.`,
        );
      }
    }

    const rawBody = await req.json();
    const validationResult = inputSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return apiResponse.badRequest(
        `Invalid input: ${validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
      );
    }

    const { url } = validationResult.data;

    const isValidUrl = await validateUrl(url);
    if (!isValidUrl) {
      return apiResponse.badRequest("URL is not accessible");
    }

    // Step 1: Parallel - scrape website and get categories
    const [scrapedData, categoriesResult] = await Promise.all([
      scrapeWebsite(url).catch((error) => {
        console.error("Scraping failed:", error);
        throw new Error(`Failed to scrape website: ${getErrorMessage(error)}`);
      }),
      getActiveCategories(),
    ]);

    if (!categoriesResult.success || !categoriesResult.data) {
      const errorMessage = !categoriesResult.success
        ? categoriesResult.error
        : "No categories data";
      console.error("Failed to get categories:", errorMessage);
      return apiResponse.serverError("Failed to get categories");
    }

    // Prepare screenshot source early (needed for parallel execution)
    const screenshotSource = scrapedData?.data?.metadata?.ogImage || scrapedData?.metadata?.ogImage;

    // Step 2: Parallel - AI generation + logo + screenshot
    const [productInfo, logoUrl, screenshotUrl] = await Promise.all([
      // AI generation
      generateProductInfo(scrapedData, url, categoriesResult.data).catch((error) => {
        console.error("AI generation failed:", error);
        throw new Error(`Failed to generate product info: ${getErrorMessage(error)}`);
      }),
      // Logo: get favicon URL then upload
      getFaviconUrl(url)
        .then((logoSource) =>
          logoSource ? downloadAndUploadImage(logoSource, "logo", "products/logos") : null,
        )
        .catch((error) => {
          console.error("Logo processing failed:", error);
          return null;
        }),
      // Screenshot upload
      screenshotSource
        ? downloadAndUploadImage(screenshotSource, "screenshots", "products/screenshots").catch(
            (error) => {
              console.error("Screenshot processing failed:", error);
              return null;
            },
          )
        : Promise.resolve(null),
    ]);

    const result = {
      url,
      name: productInfo.name || "",
      tagline: productInfo.tagline || "",
      description: productInfo.description || "",
      logoUrl: logoUrl || "",
      appImages: screenshotUrl ? [screenshotUrl] : [],
      categoryIds: productInfo.categoryIds || [],
      niche: productInfo.niche || "",
      dr: productInfo.dr || 0,
      da: productInfo.da || 0,
      traffic: productInfo.traffic || "",
      priceRange: productInfo.priceRange || "",
      linkType: productInfo.linkType || "dofollow",
      turnaroundTime: productInfo.turnaroundTime || "",
      contactEmail: productInfo.contactEmail || "",
    };

    return apiResponse.success(result);
  } catch (error) {
    return apiResponse.serverError(`Auto-fill failed: ${getErrorMessage(error)}`);
  }
}
