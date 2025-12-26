import { getActiveCategories } from "@/actions/categories/user";
import { getProductByIdForAdmin } from "@/actions/products/admin";
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
    title: "Edit Site",
    description: "Edit site as admin.",
    path: `/dashboard/sites/${productId}/edit`,
  });
}

export default async function EditProductPage({ params }: { params: Params }) {
  const { productId } = await params;

  const [productResult, categoriesResult] = await Promise.all([
    getProductByIdForAdmin(productId),
    getActiveCategories(),
  ]);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  if (!categoriesResult.success || !categoriesResult.data) {
    return (
      <div className="space-y-4 p-4 md:p-8">
        <h1 className="text-2xl font-semibold">Edit Site</h1>
        <p className="text-destructive">
          {`Error: ${!categoriesResult.success ? categoriesResult.error : "Unknown error"}`}
        </p>
      </div>
    );
  }

  const productForForm = {
    ...productResult.data,
    logoUrl: productResult.data.logoUrl ?? "",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Site</h1>
      </div>

      <EditProductClient
        product={productForForm}
        categories={categoriesResult.data as Category[]}
        productId={productId}
      />
    </div>
  );
}
