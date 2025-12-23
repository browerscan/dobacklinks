import { getAllCategories } from "@/actions/categories/admin";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { CategoriesDataTable } from "./CategoriesDataTable";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "Categories Management",
    description:
      "Here you can create, edit, and manage your product categories.",
    path: `/dashboard/categories`,
  });
}

export default async function AdminCategoriesPage() {
  const response = await getAllCategories();

  if (!response.success) {
    return <div>Error: {response.error}</div>;
  }

  return (
    <div className="space-y-6">
      <CategoriesDataTable data={response.data || []} />
    </div>
  );
}
