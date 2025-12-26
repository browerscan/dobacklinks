import { getSavedProductsAction } from "@/actions/saved-products";
import { getSession } from "@/lib/auth/server";
import { constructMetadata } from "@/lib/metadata";
import { Bookmark, BookmarkX } from "lucide-react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import SavedProductsClient from "./SavedProductsClient";
import type { SavedProductWithDetails } from "@/actions/saved-products";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    page: "Saved Products",
    title: "Saved Products",
    description: "Manage your saved products and bookmarks.",
    path: `/dashboard/saved`,
  });
}

export default async function SavedProductsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const productsResult = await getSavedProductsAction({ pageIndex: 0, pageSize: 12 });
  const initialProducts = (productsResult.success ? productsResult.data?.products : []) ?? [];
  const totalCount = (productsResult.success ? productsResult.data?.count : 0) ?? 0;

  return (
    <SavedProductsClient
      initialProducts={initialProducts as SavedProductWithDetails[]}
      totalCount={totalCount}
    />
  );
}
