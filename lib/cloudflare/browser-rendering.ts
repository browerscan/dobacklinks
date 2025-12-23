/**
 * Cloudflare Browser Rendering REST API Client
 *
 * 使用 Cloudflare Browser Rendering REST API 获取网站截图和 SEO 元数据
 * 参考: /Volumes/SSD/dev/project/public-apis/apps/backend/scripts/screenshot-batch.ts
 * 文档: https://developers.cloudflare.com/browser-rendering/
 */

import { env } from "@/lib/env";

// ============================================================================
// Types
// ============================================================================

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  format?: "png" | "jpeg" | "webp";
  quality?: number;
  fullPage?: boolean;
}

export interface SeoMetadata {
  title: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  faviconUrl: string | null;
  canonicalUrl: string | null;
  h1: string | null;
}

export interface CaptureResult {
  screenshot: Buffer;
  seoMetadata: SeoMetadata;
}

// ============================================================================
// Cloudflare Browser Rendering REST API Client
// ============================================================================

export class BrowserRenderingClient {
  private readonly accountId: string;
  private readonly apiToken: string;
  private readonly baseUrl: string;

  constructor() {
    this.accountId = env.CLOUDFLARE_ACCOUNT_ID || "";
    this.apiToken = env.CLOUDFLARE_API_TOKEN || "";
    this.baseUrl = "https://api.cloudflare.com/client/v4";

    if (!this.accountId || !this.apiToken) {
      throw new Error(
        "Cloudflare Browser Rendering credentials not configured. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env.local",
      );
    }
  }

  /**
   * 捕获网站截图
   *
   * 使用 Cloudflare Browser Rendering REST API
   */
  async captureScreenshot(
    url: string,
    options: ScreenshotOptions = {},
  ): Promise<Buffer> {
    const {
      width = env.SCREENSHOT_VIEWPORT_WIDTH,
      height = env.SCREENSHOT_VIEWPORT_HEIGHT,
    } = options;

    const endpoint = `${this.baseUrl}/accounts/${this.accountId}/browser-rendering/screenshot`;

    try {
      console.log(`📸 Capturing screenshot: ${url}`);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          viewport: { width, height },
          gotoOptions: {
            waitUntil: "domcontentloaded", // 更快：不等待所有网络请求完成
            timeout: 12000, // 减少到12秒，快速失败
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Screenshot API error (${response.status}): ${errorText}`,
        );
      }

      // Check if response is JSON error
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const json = await response.json();
        throw new Error(`API Error: ${JSON.stringify(json)}`);
      }

      // Get image buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(`✅ Screenshot captured: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.error("Screenshot capture failed:", { url }, error);
      throw error;
    }
  }

  /**
   * 提取 SEO 元数据
   *
   * 注意：Cloudflare Browser Rendering 暂不支持直接的 JavaScript 执行
   * 我们需要先获取页面内容，然后解析 HTML
   */
  async extractSeoMetadata(url: string): Promise<SeoMetadata> {
    try {
      console.log(`🔍 Extracting SEO metadata: ${url}`);

      // 直接 fetch HTML 并解析（添加超时）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }

      const html = await response.text();

      // 简单的 HTML 解析（使用正则表达式）
      const getMeta = (name: string): string | null => {
        const patterns = [
          new RegExp(
            `<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`,
            "i",
          ),
          new RegExp(
            `<meta\\s+content=["']([^"']+)["']\\s+name=["']${name}["']`,
            "i",
          ),
        ];
        for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match) return match[1];
        }
        return null;
      };

      const getProperty = (property: string): string | null => {
        const patterns = [
          new RegExp(
            `<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`,
            "i",
          ),
          new RegExp(
            `<meta\\s+content=["']([^"']+)["']\\s+property=["']${property}["']`,
            "i",
          ),
        ];
        for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match) return match[1];
        }
        return null;
      };

      const getTitle = (): string | null => {
        const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        return match ? match[1].trim() : null;
      };

      const getLink = (rel: string): string | null => {
        const pattern = new RegExp(
          `<link\\s+[^>]*rel=["']${rel}["'][^>]*href=["']([^"']+)["']`,
          "i",
        );
        const match = html.match(pattern);
        return match ? match[1] : null;
      };

      const getH1 = (): string | null => {
        const match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        return match ? match[1].trim() : null;
      };

      const seoMetadata: SeoMetadata = {
        title: getTitle(),
        metaDescription: getMeta("description"),
        ogTitle: getProperty("og:title"),
        ogDescription: getProperty("og:description"),
        ogImage: getProperty("og:image"),
        twitterCard: getMeta("twitter:card"),
        twitterTitle: getMeta("twitter:title"),
        twitterDescription: getMeta("twitter:description"),
        twitterImage: getMeta("twitter:image"),
        faviconUrl: getLink("icon") || getLink("shortcut icon"),
        canonicalUrl: getLink("canonical"),
        h1: getH1(),
      };

      console.log("✅ SEO metadata extracted");
      return seoMetadata;
    } catch (error) {
      console.error("SEO metadata extraction failed:", { url }, error);
      throw error;
    }
  }

  /**
   * 组合操作：截图 + SEO 数据提取（并行执行）
   */
  async captureFullData(url: string): Promise<CaptureResult> {
    try {
      console.log(`🚀 Capturing full data for: ${url}`);

      // 并行执行截图和 SEO 提取
      const [screenshot, seoMetadata] = await Promise.all([
        this.captureScreenshot(url),
        this.extractSeoMetadata(url),
      ]);

      console.log("✅ Full data captured successfully");
      return { screenshot, seoMetadata };
    } catch (error) {
      console.error("Full data capture failed:", { url }, error);
      throw error;
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let browserRenderingClient: BrowserRenderingClient | null = null;

export function getBrowserRenderingClient(): BrowserRenderingClient {
  if (!browserRenderingClient) {
    browserRenderingClient = new BrowserRenderingClient();
  }
  return browserRenderingClient;
}
