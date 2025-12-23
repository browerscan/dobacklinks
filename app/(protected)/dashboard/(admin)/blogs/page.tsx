import { listPostsAction } from "@/actions/blogs/posts";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { PostsDataTable } from "./PostsDataTable";

const PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "Blogs",
    description: "Manage your blog posts.",
    path: `/dashboard/blogs`,
  });
}

export default async function AdminBlogsPage() {
  // Fetch posts - initial load
  const result = await listPostsAction({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  if (!result.success) {
    return (
      <div className="space-y-4 p-4 md:p-8">
        <h1 className="text-2xl font-semibold">Blogs Management</h1>
        <p className="text-destructive">{result.error ?? "Unknown error"}</p>
      </div>
    );
  }

  const posts = result.data?.posts || [];
  const totalPosts = result.data?.count || 0;
  const pageCount = Math.ceil(totalPosts / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PostsDataTable
        initialData={posts}
        initialPageCount={pageCount}
        pageSize={PAGE_SIZE}
        totalPosts={totalPosts}
      />
    </div>
  );
}
