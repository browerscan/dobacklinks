import { constructMetadata } from "@/lib/metadata";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";
import CreateBlogClient from "./CreateBlogClient";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    page: "CreateBlog",
    title: "Create Blog Post",
    description: "Create a new blog post",
    path: `/dashboard/blogs/new`,
  });
}

export default function CreateBlogPage() {
  return (
    <Suspense fallback={<Loader2 className="w-4 h-4 animate-spin" />}>
      <CreateBlogClient />
    </Suspense>
  );
}
