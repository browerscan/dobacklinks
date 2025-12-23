import { getActiveCategories } from "@/actions/categories/user";
import { constructMetadata } from "@/lib/metadata";
import { Category } from "@/types/product";
import { Metadata } from "next";
import CreateProductClient from "./CreateProductClient";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "Create New Site",
    description: "Create a new site as admin.",
    path: "/dashboard/sites/new",
  });
}

export default async function CreateProductPage() {
  const categoriesResult = await getActiveCategories();

  if (!categoriesResult.success || !categoriesResult.data) {
    return (
      <div className="space-y-4 p-4 md:p-8">
        <h1 className="text-2xl font-semibold">Create New Site</h1>
        <p className="text-destructive">
          {`Error: ${
            !categoriesResult.success ? categoriesResult.error : "Unknown error"
          }`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create New Site
        </h1>
      </div>

      <CreateProductClient categories={categoriesResult.data as Category[]} />
    </div>
  );
}
