import { getActiveCategoriesWithCounts } from "@/actions/categories/user";
import { getLiveProductsCount } from "@/actions/products/user";
import SidebarInsetFooter from "@/components/footer/SidebarInsetFooter";
import SidebarInsetHeader from "@/components/header/SidebarInsetHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CategoriesSidebar } from "./CategoriesSidebar";

export const revalidate = 600;

export default async function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [categoriesResponse, productCountResponse] = await Promise.all([
    getActiveCategoriesWithCounts(),
    getLiveProductsCount(),
  ]);

  const categories = categoriesResponse.success ? (categoriesResponse.data ?? []) : [];

  const productCount = productCountResponse.success ? (productCountResponse.data ?? 0) : 0;

  return (
    <SidebarProvider>
      <CategoriesSidebar categories={categories} productCount={productCount} />
      <SidebarInset>
        <SidebarInsetHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <SidebarInsetFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
