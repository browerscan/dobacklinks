import { getActiveCategories } from "@/actions/categories/user";
import { getProductByIdForEdit } from "@/actions/products/user";
import { constructMetadata } from "@/lib/metadata";
import { Category } from "@/types/product";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import EditProductClient from "./EditProductClient";

type Params = Promise<{ productId: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { productId } = await params;
  return constructMetadata({
    page: "Edit Product",
    title: "Edit Product",
    description: "Edit your product.",
    path: `/dashboard/profile/edit-product/${productId}`,
  });
}

export default async function EditProductPage({ params }: { params: Params }) {
  const { productId } = await params;

  const [productResult, categoriesResult] = await Promise.all([
    getProductByIdForEdit(productId),
    getActiveCategories(),
  ]);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  if (!categoriesResult.success || !categoriesResult.data) {
    notFound();
  }

  const productForForm = {
    ...productResult.data,
    logoUrl: productResult.data.logoUrl ?? "",
  };

  return (
    <EditProductClient
      product={productForForm}
      categories={categoriesResult.data as Category[]}
      productId={productId}
    />
  );
}
