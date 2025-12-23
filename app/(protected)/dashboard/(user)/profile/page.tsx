import { getMyProducts } from "@/actions/products/user";
import { getSession } from "@/lib/auth/server";
import { user as userSchema } from "@/lib/db/schema";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import MyProducts from "./MyProducts";
import Settings from "./Settings";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    page: "Profile",
    title: "Profile",
    description: "Manage your profile settings.",
    path: `/dashboard/profile`,
  });
}

type User = typeof userSchema.$inferSelect;

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const productsResult = await getMyProducts();
  const initialProducts = productsResult.success
    ? productsResult.data?.products
    : [];
  const totalCount = productsResult.success ? productsResult.data?.count : 0;

  return (
    <div className="flex flex-col gap-4">
      <Settings user={session.user as User} />
      <MyProducts initialProducts={initialProducts} totalCount={totalCount} />
    </div>
  );
}
