/**
 * Screenshot Storage Service (R2 + CDN)
 *
 * Generates thumbnails and uploads them to Cloudflare R2 storage
 * Screenshots are served via CDN at https://cdn.dobacklinks.com
 */

import sharp from "sharp";
import { env } from "@/lib/env";
import { serverUploadFile } from "@/lib/cloudflare/r2";

// ============================================================================
// Types
// ============================================================================
export interface UploadResult {
  fullUrl: string; // 与 thumbnailUrl 相同（用于兼容）
  thumbnailUrl: string; // 缩略图 URL
  r2Key?: string; // R2 存储键 (optional for local fallback)
}

// ============================================================================
// Screenshot Storage Service
// ============================================================================
export class ScreenshotStorage {
  private readonly thumbnailWidth: number;
  private readonly thumbnailHeight: number;
  private readonly format: "webp" | "png" | "jpeg";
  private readonly quality: number;
  private readonly r2Enabled: boolean;

  constructor() {
    this.thumbnailWidth = env.SCREENSHOT_THUMBNAIL_WIDTH || 400;
    this.thumbnailHeight = env.SCREENSHOT_THUMBNAIL_HEIGHT || 300;
    this.format = (env.SCREENSHOT_FORMAT as "webp" | "png" | "jpeg") || "webp";
    this.quality = env.SCREENSHOT_QUALITY || 80;
    this.r2Enabled = !!(
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL &&
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
    );
  }

  /**
   * 生成缩略图并上传到 R2
   *
   * @param buffer - 原始截图 Buffer
   * @param domain - 域名（用于文件命名）
   * @returns 缩略图 URL（CDN URL）
   */
  async saveScreenshot(buffer: Buffer, domain: string): Promise<UploadResult> {
    try {
      // 1. 生成缩略图
      const thumbnail = await this.generateThumbnail(buffer);

      // 2. 生成文件名
      const sanitizedDomain = this.sanitizeDomain(domain);
      const timestamp = Date.now();
      const thumbFileName = `${sanitizedDomain}-${timestamp}-thumb.${this.format}`;

      // 3. 上传到 R2 或保存到本地（fallback）
      let thumbnailUrl: string;
      let r2Key: string | null = null;

      if (this.r2Enabled) {
        // Upload to R2
        const r2Path = "screenshots/thumbnails";
        const uploadResult = await serverUploadFile({
          data: thumbnail,
          contentType: this.format === "webp" ? "image/webp" : `image/${this.format}`,
          path: r2Path,
          key: thumbFileName,
        });
        thumbnailUrl = uploadResult.url;
        r2Key = uploadResult.key;
        console.log("Thumbnail uploaded to R2:", { domain, thumbnailUrl, r2Key });
      } else {
        // Fallback: save to local public directory (for development only)
        console.warn("R2 not configured, saving locally (development mode only)");
        if (typeof window === "undefined") {
          const fs = await import("fs/promises");
          const path = await import("path");

          const publicDir = process.cwd() + "/public";
          const thumbDir = path.join(publicDir, "screenshots", "thumbnails");
          await fs.mkdir(thumbDir, { recursive: true });

          const thumbPath = path.join(thumbDir, thumbFileName);
          await fs.writeFile(thumbPath, thumbnail);
        }
        thumbnailUrl = `/screenshots/thumbnails/${thumbFileName}`;
        console.log("Thumbnail saved locally:", { domain, thumbnailUrl });
      }

      return {
        fullUrl: thumbnailUrl,
        thumbnailUrl,
        r2Key: r2Key ?? undefined,
      };
    } catch (error) {
      console.error("Thumbnail save failed:", { domain }, error);
      throw error;
    }
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(this.thumbnailWidth, this.thumbnailHeight, {
          fit: "cover",
          position: "top",
        })
        .webp({ quality: this.quality - 10 })
        .toBuffer();
    } catch (error) {
      console.error("Thumbnail generation failed:", error);
      throw error;
    }
  }

  /**
   * 清理域名用于文件命名
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
   * 提取域名从 URL
   */
  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    }
  }

  /**
   * 检查 R2 是否已启用
   */
  isR2Enabled(): boolean {
    return this.r2Enabled;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================
let screenshotStorage: ScreenshotStorage | null = null;

export function getScreenshotStorage(): ScreenshotStorage {
  if (!screenshotStorage) {
    screenshotStorage = new ScreenshotStorage();
  }
  return screenshotStorage;
}
