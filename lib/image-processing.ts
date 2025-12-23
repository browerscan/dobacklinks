import { serverUploadFile } from "@/lib/cloudflare/r2";

// Timeout for image download (20 seconds)
const IMAGE_DOWNLOAD_TIMEOUT = 20000;

export async function downloadAndUploadImage(
  imageUrl: string,
  prefix: string,
  path: string,
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(IMAGE_DOWNLOAD_TIMEOUT),
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type");
    if (!contentType?.startsWith("image/")) return null;

    const buffer = await response.arrayBuffer();
    const fileName = `${prefix}_${Date.now()}.${contentType.split("/")[1]}`;

    const result = await serverUploadFile({
      data: Buffer.from(buffer),
      contentType,
      path,
      key: fileName,
    });

    return result.url;
  } catch (error) {
    console.error("Failed to download and upload image:", error);
    return null;
  }
}
