"use client";

import {
  getPostByIdAction,
  updatePostAction,
  type PostWithTags,
} from "@/actions/blogs/posts";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { PostForm, type PostFormValues } from "../../PostForm";

export default function EditBlogClient() {
  const router = useRouter();
  const params = useParams();
  const { postId } = params;

  const [post, setPost] = useState<PostWithTags | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    const fetchPost = async () => {
      if (typeof postId !== "string") {
        toast.error("Invalid post ID");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const result = await getPostByIdAction({ postId });
        if (result.success && result.data?.post) {
          setPost(result.data.post);
        } else {
          toast.error("Failed to fetch post", { description: result.error });
          setPost(null);
        }
      } catch (error) {
        toast.error("Unexpected error occurred");
        console.error("Failed to fetch post:", error);
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId, router]);

  const handleUpdatePost = async (data: PostFormValues) => {
    if (!post?.id) return;

    const updateData = {
      ...data,
      id: post.id,
    };

    const result = await updatePostAction({
      data: updateData,
    });

    if (result.success) {
      toast.success("Blog post updated successfully!");
      router.push(`/dashboard/blogs`);
      router.refresh();
    } else {
      toast.error("Error updating blog post", {
        description: result.error || "Failed to update the blog post",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-6 p-4 md:p-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Post Not Found</h2>
        <p className="text-muted-foreground">
          The requested post could not be found
        </p>
        <Button onClick={() => router.push(`/dashboard/blogs`)}>
          Back to List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Blog Post</h1>
        <p className="text-muted-foreground">Edit an existing blog post</p>
      </div>
      <PostForm
        initialData={post}
        onSubmit={async (data) =>
          startTransition(() => {
            handleUpdatePost(data);
          })
        }
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
