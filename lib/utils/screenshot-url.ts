/**
 * Screenshot URL Helper
 *
 * Handles screenshot URLs from various sources:
 * - R2 CDN URLs (https://cdn.dobacklinks.com/...)
 * - Local paths (/screenshots/thumbnails/...) for development fallback
 * - External URLs
 */

const R2_CDN_BASE = "https://cdn.dobacklinks.com";
const LOCAL_SCREENSHOT_PREFIX = "/screenshots/thumbnails/";
const R2_SCREENSHOT_PREFIX = `${R2_CDN_BASE}/screenshots/thumbnails/`;

/**
 * Gets a valid screenshot URL, returning null for invalid/unmigrated paths
 *
 * @param url - The original URL (local path or full URL)
 * @returns The valid CDN URL, or null if the screenshot is not available in R2
 *
 * NOTE: Local paths (/screenshots/...) are NOT converted to CDN URLs because
 * they may not exist in R2. Only URLs that are already CDN URLs or have been
 * explicitly migrated will be returned.
 */
export function getScreenshotUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // If it's already an R2 CDN URL, return as-is
  if (url.startsWith(R2_CDN_BASE)) {
    return url;
  }

  // Local paths should NOT be converted to CDN URLs
  // These are legacy paths from before R2 migration
  // Return null so the UI shows a placeholder instead of broken images
  if (url.startsWith(LOCAL_SCREENSHOT_PREFIX)) {
    return null;
  }

  // If it's already a full URL (external), return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Unknown format, return null
  return null;
}

/**
 * Checks if a URL is a local screenshot path
 */
export function isLocalScreenshotPath(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith(LOCAL_SCREENSHOT_PREFIX);
}

/**
 * Checks if a URL is an R2 CDN URL
 */
export function isR2ScreenshotUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith(R2_SCREENSHOT_PREFIX);
}
