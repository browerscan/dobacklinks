import { getAllCategories } from "@/actions/categories/admin";
import { getProductsAsAdminAction } from "@/actions/products/admin";
import { Button } from "@/components/ui/button";
import { constructMetadata } from "@/lib/metadata";
import { Plus } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { ProductsDataTable } from "./ProductsDataTable";

const PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "Sites Management",
    description: "Manage sites in the admin dashboard",
    path: `/dashboard/sites`,
  });
}

export default async function AdminProductsPage() {
  const [productsResponse, categoriesResponse] = await Promise.all([
    getProductsAsAdminAction({ pageIndex: 0, pageSize: PAGE_SIZE }),
    getAllCategories(),
  ]);

  if (!productsResponse.success) {
    return (
      <div className="space-y-4 p-4 md:p-8">
        <h1 className="text-2xl font-semibold">Sites Management</h1>
        <p className="text-destructive">
          {`Error: ${productsResponse.error ?? "Unknown error"}`}
        </p>
      </div>
    );
  }

  if (!categoriesResponse.success) {
    return (
      <div className="space-y-4 p-4 md:p-8">
        <h1 className="text-2xl font-semibold">Sites Management</h1>
        <p className="text-destructive">
          {`Error: ${categoriesResponse.error ?? "Unknown error"}`}
        </p>
      </div>
    );
  }

  const products = productsResponse.data?.products || [];
  const totalProducts = productsResponse.data?.count || 0;
  const pageCount = Math.ceil(totalProducts / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Sites Management
        </h1>
        <Button asChild>
          <Link href="/dashboard/sites/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Site
          </Link>
        </Button>
      </div>

      <ProductsDataTable
        initialData={products}
        initialPageCount={pageCount}
        pageSize={PAGE_SIZE}
        totalProducts={totalProducts}
        categories={categoriesResponse.data!}
      />
    </div>
  );
}
