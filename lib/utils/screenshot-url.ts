/**
 * Screenshot URL Helper
 *
 * Converts local screenshot URLs to R2 CDN URLs
 */

const R2_CDN_BASE = "https://cdn.dobacklinks.com";
const LOCAL_SCREENSHOT_PREFIX = "/screenshots/thumbnails/";

/**
 * Converts a screenshot URL to use R2 CDN if it's a local path
 *
 * @param url - The original URL (local path or full URL)
 * @returns The R2 CDN URL or the original URL if not a local path
 */
export function getScreenshotUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // If it's a local path, convert to R2 CDN URL
  if (url.startsWith(LOCAL_SCREENSHOT_PREFIX)) {
    return `${R2_CDN_BASE}${url}`;
  }

  // If it's already a full URL or other path, return as-is
  return url;
}

/**
 * Checks if a URL is a local screenshot path
 */
export function isLocalScreenshotPath(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith(LOCAL_SCREENSHOT_PREFIX);
}
