/**
 * Edge-compatible Screenshot Storage Service
 *
 * Strategy:
 * - Node.js: Save to local public/ directory (original behavior)
 * - Edge/Workers: Upload to Cloudflare R2 + use Image Resizing
 *
 * Note: Thumbnails are generated via Cloudflare Image Resizing on-demand
 * No need to pre-generate thumbnails, reducing storage and processing
 */

import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const log = createLogger({ module: "ScreenshotStorage" });

// ============================================================================
// Types
// ============================================================================
export interface UploadResult {
  fullUrl: string; // Full-size screenshot URL
  thumbnailUrl: string; // Thumbnail URL (via Cloudflare Image Resizing)
}

interface R2Binding {
  put(key: string, value: ArrayBuffer | ReadableStream, options?: any): Promise<void>;
  get(key: string): Promise<any>;
}

// ============================================================================
// Runtime Detection
// ============================================================================
function isEdgeRuntime(): boolean {
  return (
    // @ts-ignore - EdgeRuntime is a global in edge runtime
    typeof EdgeRuntime !== "undefined" ||
    // @ts-ignore - navigator exists in Workers
    (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers")
  );
}

// ============================================================================
// Screenshot Storage Service (Edge-compatible)
// ============================================================================
export class ScreenshotStorage {
  private readonly thumbnailWidth: number;
  private readonly thumbnailHeight: number;
  private readonly format: "webp" | "png" | "jpeg";
  private readonly quality: number;
  private readonly publicDir: string;
  private readonly r2Bucket?: R2Binding;

  constructor(r2Bucket?: R2Binding) {
    this.thumbnailWidth = env.SCREENSHOT_THUMBNAIL_WIDTH || 400;
    this.thumbnailHeight = env.SCREENSHOT_THUMBNAIL_HEIGHT || 300;
    this.format = (env.SCREENSHOT_FORMAT as "webp" | "png" | "jpeg") || "webp";
    this.quality = env.SCREENSHOT_QUALITY || 80;
    this.publicDir = process.cwd() + "/public";
    this.r2Bucket = r2Bucket;
  }

  /**
   * Save screenshot (Edge-compatible)
   *
   * @param buffer - Screenshot buffer
   * @param domain - Domain name for filename
   * @returns Upload result with URLs
   */
  async saveScreenshot(buffer: Buffer, domain: string): Promise<UploadResult> {
    const sanitizedDomain = this.sanitizeDomain(domain);
    const timestamp = Date.now();
    const fileName = `${sanitizedDomain}-${timestamp}.${this.format}`;

    // Edge runtime: Upload to R2
    if (isEdgeRuntime() && this.r2Bucket) {
      return this.saveToR2(buffer, fileName, domain);
    }

    // Node.js: Save to local public/ directory
    return this.saveToLocal(buffer, fileName, domain);
  }

  /**
   * Save to Cloudflare R2 (Edge runtime)
   */
  private async saveToR2(buffer: Buffer, fileName: string, domain: string): Promise<UploadResult> {
    try {
      if (!this.r2Bucket) {
        throw new Error("R2 bucket not configured");
      }

      // Upload original to R2
      const key = `screenshots/${fileName}`;
      // Convert Buffer to ArrayBuffer for R2
      // Slice returns ArrayBuffer | SharedArrayBuffer, explicitly cast to ArrayBuffer
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer;
      await this.r2Bucket.put(key, arrayBuffer, {
        httpMetadata: {
          contentType: `image/${this.format}`,
        },
      });

      // Generate URLs using Cloudflare R2 public URL
      const r2PublicUrl = env.R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;
      if (!r2PublicUrl) {
        throw new Error("R2_PUBLIC_URL not configured");
      }

      const fullUrl = `${r2PublicUrl}/${key}`;

      // Generate thumbnail URL using Cloudflare Image Resizing
      // Format: /cdn-cgi/image/width=400,height=300,fit=cover,quality=80/<image-url>
      const thumbnailUrl = `/cdn-cgi/image/width=${this.thumbnailWidth},height=${this.thumbnailHeight},fit=cover,quality=${this.quality},format=${this.format}/${fullUrl}`;

      log.info("Screenshot saved to R2", { domain, fullUrl, thumbnailUrl });

      return { fullUrl, thumbnailUrl };
    } catch (error) {
      log.error("R2 upload failed", { domain }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Save to local public/ directory (Node.js runtime)
   */
  private async saveToLocal(
    buffer: Buffer,
    fileName: string,
    domain: string,
  ): Promise<UploadResult> {
    try {
      // Dynamic imports to avoid bundling in edge runtime
      const fs = await import("fs/promises");
      const path = await import("path");

      // Option 1: Use sharp for thumbnail generation (if available)
      let thumbnailBuffer: Buffer | null = null;
      try {
        const sharp = (await import("sharp")).default;
        thumbnailBuffer = await sharp(buffer)
          .resize(this.thumbnailWidth, this.thumbnailHeight, {
            fit: "cover",
            position: "top",
          })
          .webp({ quality: this.quality - 10 })
          .toBuffer();
      } catch (error) {
        log.warn("Sharp not available, skipping thumbnail generation");
      }

      // Create directories
      const screenshotsDir = path.join(this.publicDir, "screenshots");
      const thumbDir = path.join(screenshotsDir, "thumbnails");
      await fs.mkdir(screenshotsDir, { recursive: true });
      await fs.mkdir(thumbDir, { recursive: true });

      // Save full-size screenshot
      const fullPath = path.join(screenshotsDir, fileName);
      await fs.writeFile(fullPath, buffer);

      // Save thumbnail (if generated)
      const thumbFileName = `${path.parse(fileName).name}-thumb.${this.format}`;
      const thumbPath = path.join(thumbDir, thumbFileName);

      if (thumbnailBuffer) {
        await fs.writeFile(thumbPath, thumbnailBuffer);
      } else {
        // Fallback: copy full image as thumbnail
        await fs.writeFile(thumbPath, buffer);
      }

      // Return relative URLs
      const fullUrl = `/screenshots/${fileName}`;
      const thumbnailUrl = `/screenshots/thumbnails/${thumbFileName}`;

      log.info("Screenshot saved locally", { domain, fullUrl, thumbnailUrl });

      return { fullUrl, thumbnailUrl };
    } catch (error) {
      log.error("Local save failed", { domain }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Sanitize domain for filename
   */
  private sanitizeDomain(domain: string): string {
    return domain
      .replace(/^https?:\/\/(www\.)?/, "")
      .replace(/[^a-z0-9]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .substring(0, 50);
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================
let screenshotStorage: ScreenshotStorage | null = null;

/**
 * Get ScreenshotStorage instance
 *
 * @param r2Bucket - Optional Cloudflare R2 bucket binding (for Workers)
 * @returns ScreenshotStorage instance
 */
export function getScreenshotStorage(r2Bucket?: R2Binding): ScreenshotStorage {
  if (!screenshotStorage) {
    screenshotStorage = new ScreenshotStorage(r2Bucket);
  }
  return screenshotStorage;
}
