import slugify from "slugify";

export function getURL(path: string = "") {
  let url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  url = url.startsWith("http") ? url : `https://${url}`;
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
  url = `${url}${path}`;
  return url;
}

export function getDomain(url: string) {
  try {
    const urlWithProtocol = url.startsWith("http") ? url : `https://${url}`;
    const domain = new URL(urlWithProtocol).hostname;
    return domain.replace(/^www\./, "");
  } catch (error) {
    return url;
  }
}

export async function validateUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function slugifyHostname(hostname: string) {
  let slug = hostname.toLowerCase().replace(/\./g, "-");
  slug = slug.replace(/[^a-z0-9-]/g, "");

  return slug;
}

export function universalSlugify(name: string, url: string) {
  const preparedText = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  let slug = slugify(preparedText, {
    replacement: "-",
    remove: /[*+~.()'"!:@]/g,
    lower: true,
    strict: true,
    trim: true,
  });

  if (!slug) {
    const hostname = new URL(url).hostname;
    slug = slugifyHostname(hostname);
  }

  return slug;
}

/**
 * Normalize URL for comparison
 * Removes protocol (http://, https://) and trailing slash
 */
export function normalizeUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, "") // Remove protocol
    .replace(/\/$/, "") // Remove trailing slash
    .toLowerCase(); // Case insensitive
}
