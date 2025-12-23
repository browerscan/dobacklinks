import { constructMetadata } from "@/lib/metadata";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const dynamicParams = true;

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "Services",
    description: `Guest post services and directory access`,
    path: `/pricing`,
  });
}

export default async function Page() {
  redirect("/services");
}
