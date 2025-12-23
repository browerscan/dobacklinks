"use client";

import { type PostWithTags } from "@/actions/blogs/posts";
import { generateAdminPresignedUploadUrl } from "@/actions/r2-resources";
import { basePostSchema } from "@/app/(protected)/dashboard/(admin)/blogs/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BLOGS_IMAGE_PATH } from "@/config/common";
import { getErrorMessage } from "@/lib/error-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  codeBlockPlugin,
  CreateLink,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  InsertImage,
  InsertTable,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  MDXEditorMethods,
  quotePlugin,
  Separator,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUpload } from "./ImageUpload";
import { TagInput } from "./TagInput";

function ContentToolbar() {
  return (
    <>
      <DiffSourceToggleWrapper>
        <BoldItalicUnderlineToggles />
        <Separator />
        <ListsToggle />
        <Separator />
        <BlockTypeSelect />
        <Separator />
        <CreateLink />
        <InsertImage />
        <Separator />
        <InsertTable />
        <Separator />
      </DiffSourceToggleWrapper>
    </>
  );
}

export type FormTag = {
  id: string;
  name: string;
};
export type PostFormValues = z.infer<typeof postFormSchema>;

const postFormSchema = basePostSchema;

interface PostFormProps {
  initialData?: PostWithTags | null;
  isDuplicate?: boolean;
  onSubmit: (data: PostFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function PostForm({
  initialData,
  isDuplicate,
  onSubmit,
  isSubmitting,
}: PostFormProps) {
  const router = useRouter();

  const defaultValues: Partial<PostFormValues> = {
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    featuredImageUrl: initialData?.featuredImageUrl || "",
    content: initialData?.content || "",
    tags:
      initialData?.tags?.map((t) => ({
        id: t.id,
        name: t.name,
      })) || [],
    isPinned: initialData?.isPinned ?? false,
    status: initialData?.status || "draft",
    visibility:
      initialData?.visibility === "subscribers"
        ? "logged_in"
        : initialData?.visibility || "public",
  };

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues,
    mode: "onChange",
  });
  const mdxEditorRef = useRef<MDXEditorMethods>(null);

  const handleFormSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  const generateSlug = () => {
    const title = form.getValues("title");
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    form.setValue("slug", slug, { shouldValidate: true });
  };

  const handleImageUpload = async (imageFile: File): Promise<string> => {
    if (!imageFile.type.startsWith("image/")) {
      toast.error("Upload failed", {
        description: "Please select an image file.",
      });
      return "";
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      toast.error("Upload failed", {
        description: `File size limit: ${maxSize / 1024 / 1024}MB`,
      });
      return "";
    }

    try {
      const filenamePrefix = "post-image";

      const presignedUrlActionResponse = await generateAdminPresignedUploadUrl({
        fileName: imageFile.name,
        contentType: imageFile.type,
        prefix: filenamePrefix,
        path: BLOGS_IMAGE_PATH,
      });

      if (
        !presignedUrlActionResponse.success ||
        !presignedUrlActionResponse.data
      ) {
        toast.error("Upload failed", {
          description:
            presignedUrlActionResponse.error ||
            "Failed to generate presigned URL",
        });
        return "";
      }

      const { presignedUrl, publicObjectUrl } = presignedUrlActionResponse.data;

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: imageFile,
        headers: {
          "Content-Type": imageFile.type,
        },
      });

      if (!uploadResponse.ok) {
        let r2Error = "";
        try {
          r2Error = await uploadResponse.text();
        } catch {}
        console.error("R2 Upload Error (MDX):", r2Error, uploadResponse);
        throw new Error(r2Error);
      }
      return publicObjectUrl;
    } catch (error) {
      console.error("MDX Image Upload failed:", error);
      toast.error(getErrorMessage(error) || "An unexpected error occurred.");
      throw error;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-8">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter title"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    The title of your blog post. (
                    {`${field.value?.length || 0} / 70`})
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="Enter slug"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateSlug}
                      size="sm"
                      disabled={isSubmitting}
                    >
                      Generate
                    </Button>
                  </div>
                  <FormDescription>
                    The URL-friendly version of the title.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    A short summary of the post. (
                    {`${field.value?.length || 0} / 160`})
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Tags Input */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value || []}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Add up to 5 tags to your post.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Featured Image Upload */}
            <FormField
              control={form.control}
              name="featuredImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Featured Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <MDXEditor
                      ref={mdxEditorRef}
                      className="border rounded-md"
                      markdown={field.value || ""}
                      onChange={(md) => field.onChange(md)}
                      contentEditableClassName="max-w-full min-h-[400px] max-h-[600px] overflow-y-auto prose"
                      plugins={[
                        listsPlugin(),
                        quotePlugin(),
                        headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
                        linkPlugin(),
                        linkDialogPlugin(),
                        thematicBreakPlugin(),
                        frontmatterPlugin(),
                        codeBlockPlugin(),
                        imagePlugin({ imageUploadHandler: handleImageUpload }),
                        tablePlugin(),
                        markdownShortcutPlugin(),
                        diffSourcePlugin({
                          viewMode: "source",
                        }),
                        toolbarPlugin({
                          toolbarContents: () => <ContentToolbar />,
                        }),
                      ]}
                      placeholder="Write your post here..."
                      readOnly={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    The main content of your post.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Status Selector */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Visibility Selector */}
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="logged_in">Logged In</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Pinned */}
            <FormField
              control={form.control}
              name="isPinned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Pin Post</FormLabel>
                    <FormDescription>
                      Pin this post to the top of the blog.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Submitting..."
                  : initialData && !isDuplicate
                    ? "Update"
                    : "Create"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
