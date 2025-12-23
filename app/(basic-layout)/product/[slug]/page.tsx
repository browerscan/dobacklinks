import { getProductBySlug } from "@/actions/products/user";
import { ProductDetailContent } from "@/app/(basic-layout)/product/[slug]/ProductDetailContent";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const dynamicParams = true;

type Params = Promise<{
  slug: string;
}>;

type MetadataProps = {
  params: Params;
};
export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);

  if (!result.success || !result.data) {
    return constructMetadata({
      title: "404",
      description: "Product not found",
      noIndex: true,
      path: `/product/${slug}`,
    });
  }

  const product = result.data;
  const fullPath = `/product/${slug}`;

  return constructMetadata({
    title: product.name,
    description: product.tagline,
    path: fullPath,
    useDefaultOgImage: false,
  });
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  // Redirect legacy /product/* to new /sites/*
  redirect(`/sites/${slug}`);
}
