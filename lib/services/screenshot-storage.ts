/**
 * Screenshot Storage Service (Cloudflare Pages Compatible)
 *
 * 只生成和保存缩略图到本地 public/screenshots/thumbnails/ 目录
 * 静态部署到 Cloudflare Pages
 */

import sharp from "sharp";
import { env } from "@/lib/env";

// ============================================================================
// Types
// ============================================================================
export interface UploadResult {
  fullUrl: string;      // 与 thumbnailUrl 相同（用于兼容）
  thumbnailUrl: string; // 缩略图 URL
}

// ============================================================================
// Screenshot Storage Service
// ============================================================================
export class ScreenshotStorage {
  private readonly thumbnailWidth: number;
  private readonly thumbnailHeight: number;
  private readonly format: "webp" | "png" | "jpeg";
  private readonly quality: number;
  private readonly publicDir: string;

  constructor() {
    this.thumbnailWidth = env.SCREENSHOT_THUMBNAIL_WIDTH || 400;
    this.thumbnailHeight = env.SCREENSHOT_THUMBNAIL_HEIGHT || 300;
    this.format = (env.SCREENSHOT_FORMAT as "webp" | "png" | "jpeg") || "webp";
    this.quality = env.SCREENSHOT_QUALITY || 80;
    this.publicDir = process.cwd() + "/public";
  }

  /**
   * 生成缩略图并保存到本地
   *
   * @param buffer - 原始截图 Buffer
   * @param domain - 域名（用于文件命名）
   * @returns 缩略图 URL（fullUrl 和 thumbnailUrl 相同）
   */
  async saveScreenshot(buffer: Buffer, domain: string): Promise<UploadResult> {
    try {
      // 1. 生成缩略图
      const thumbnail = await this.generateThumbnail(buffer);

      // 2. 生成文件名
      const sanitizedDomain = this.sanitizeDomain(domain);
      const timestamp = Date.now();
      const thumbFileName = `${sanitizedDomain}-${timestamp}-thumb.${this.format}`;

      // 3. 确保目录存在（仅本地开发需要）
      if (typeof window === "undefined") {
        // 仅在服务端运行
        const fs = await import("fs/promises");
        const path = await import("path");

        const thumbDir = path.join(this.publicDir, "screenshots", "thumbnails");
        await fs.mkdir(thumbDir, { recursive: true });

        // 4. 保存缩略图
        const thumbPath = path.join(thumbDir, thumbFileName);
        await fs.writeFile(thumbPath, thumbnail);
      }

      // 5. 返回相对 URL（静态部署）
      const thumbnailUrl = `/screenshots/thumbnails/${thumbFileName}`;

      console.log("Thumbnail saved successfully:", {
        domain,
        thumbnailUrl,
      });

      return { fullUrl: thumbnailUrl, thumbnailUrl };
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
