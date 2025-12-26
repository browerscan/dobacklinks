import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import EditBlogClient from "./EditBlogClient";

type Params = Promise<{ postId: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { postId } = await params;

  return constructMetadata({
    page: "EditBlog",
    title: "Edit Blog Post",
    description: "Edit an existing blog post",
    path: `/dashboard/blogs/${postId}/edit`,
  });
}

export default function EditBlogPage() {
  return <EditBlogClient />;
}
