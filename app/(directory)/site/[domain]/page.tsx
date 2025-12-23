import slugify from "slugify";
import { redirect } from "next/navigation";

export default async function LegacyDomainRoute({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const decodedDomain = decodeURIComponent(domain);
  const slug = slugify(decodedDomain, { lower: true, strict: true });
  redirect(`/sites/${slug}`);
}
