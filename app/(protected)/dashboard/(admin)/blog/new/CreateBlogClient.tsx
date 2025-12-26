"use client";

import { createPostAction, getPostByIdAction, PostWithTags } from "@/actions/blogs/posts";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { PostForm, type PostFormValues } from "../PostForm";

export default function CreateBlogClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [initialData, setInitialData] = useState<PostWithTags | null>(null);
  const [isLoadingDuplicate, setIsLoadingDuplicate] = useState(false);
  const [pageMode, setPageMode] = useState<"create" | "duplicate">("create");

  useEffect(() => {
    const duplicatePostId = searchParams.get("duplicatePostId");

    if (duplicatePostId) {
      setPageMode("duplicate");
      setIsLoadingDuplicate(true);
      const fetchPostToDuplicate = async () => {
        try {
          const result = await getPostByIdAction({
            postId: duplicatePostId,
          });
          if (result.success && result.data?.post) {
            const originalPost = result.data.post;
            const duplicatedPostData: PostWithTags = {
              ...originalPost,
              id: "",
              title: `${originalPost.title} (Copy)`,
              slug: `${originalPost.slug}`,
              status: "draft",
              isPinned: false,
              publishedAt: null,
            };
            setInitialData(duplicatedPostData);
          } else {
            toast.error("Error fetching post to duplicate", {
              description: result.error || "Failed to fetch the post to duplicate",
            });
            setInitialData(null);
            setPageMode("create");
          }
        } catch (error) {
          toast.error("Unexpected error occurred");
          console.error("Failed to fetch post for duplication:", error);
          setInitialData(null);
          setPageMode("create");
        } finally {
          setIsLoadingDuplicate(false);
        }
      };
      fetchPostToDuplicate();
    }
  }, [searchParams]);

  async function handleCreatePost(data: PostFormValues): Promise<void> {
    const result = await createPostAction({
      data: { ...data },
    });

    if (result.success && result.data?.postId) {
      toast.success("Blog post created successfully!");
      router.push(`/dashboard/blog`);
    } else {
      toast.error("Error creating blog post", {
        description: result.error || "Failed to create the blog post",
      });
    }
  }

  if (isLoadingDuplicate) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Loading post to duplicate...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create Blog Post</h1>
        <p className="text-muted-foreground">Create a new blog post</p>
      </div>
      <PostForm
        initialData={initialData}
        isDuplicate={pageMode === "duplicate"}
        onSubmit={async (data) => {
          startTransition(() => {
            handleCreatePost(data);
          });
        }}
        isSubmitting={isPending}
      />
    </div>
  );
}
