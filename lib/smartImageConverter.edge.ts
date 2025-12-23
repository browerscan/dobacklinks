/**
 * Edge-compatible image converter
 *
 * Strategy:
 * - Node.js: Use sharp for webp conversion (original behavior)
 * - Edge/Workers: Use Cloudflare Image Resizing or skip conversion
 *
 * Note: next/og actually supports webp natively, so conversion may not be needed
 */

// Detect runtime
function isEdgeRuntime(): boolean {
  return (
    // @ts-ignore - EdgeRuntime is a global in edge runtime
    typeof EdgeRuntime !== "undefined" ||
    // @ts-ignore - navigator exists in Workers
    (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers")
  );
}

/**
 * Convert image to Edge-compatible format
 *
 * @param imageUrl - Image URL to convert
 * @returns Converted image URL or data URI
 */
export const smartImageConverter = async (imageUrl: string): Promise<string> => {
  const isWebpExt = imageUrl.toLowerCase().endsWith(".webp");

  // If not webp, return as-is
  if (!isWebpExt) {
    return imageUrl;
  }

  // Edge runtime: Use Cloudflare Image Resizing
  if (isEdgeRuntime()) {
    try {
      // Option 1: Use Cloudflare Image Resizing to convert webp to png
      // Format: /cdn-cgi/image/format=png/<image-url>
      const url = new URL(imageUrl);

      // If it's an external URL, use Cloudflare Image Resizing
      if (url.protocol.startsWith("http")) {
        return `/cdn-cgi/image/format=png,quality=85/${imageUrl}`;
      }

      // Option 2: next/og supports webp natively, just return the URL
      // This is the simplest and most performant approach
      console.log("⚡ Edge runtime: returning webp URL (next/og supports webp)");
      return imageUrl;
    } catch (error) {
      console.warn("⚠️ Image conversion failed in edge runtime, returning original:", error);
      return imageUrl;
    }
  }

  // Node.js runtime: Use sharp for conversion
  try {
    // Dynamic import to avoid bundling sharp in edge runtime
    const sharp = (await import("sharp")).default;

    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();

    const image = sharp(Buffer.from(buffer));
    const metadata = await image.metadata();

    if (metadata.format === "webp") {
      const pngBuffer = await image.png().toBuffer();
      return `data:image/png;base64,${pngBuffer.toString("base64")}`;
    } else {
      return `data:image/${metadata.format};base64,${Buffer.from(buffer).toString("base64")}`;
    }
  } catch (error) {
    console.error("⚠️ Image conversion failed:", error);
    return imageUrl;
  }
};

/**
 * Optimized version: Skip conversion since next/og supports webp
 * This is the recommended approach for Edge runtime
 */
export const smartImageConverterSimple = async (imageUrl: string): Promise<string> => {
  // next/og supports webp, png, jpeg natively
  // No conversion needed!
  return imageUrl;
};
