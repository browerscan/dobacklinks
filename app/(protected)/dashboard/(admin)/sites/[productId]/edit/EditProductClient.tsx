"use client";

import { updateProductAsAdminAction } from "@/actions/products/admin";
import {
  ProductFormValues,
  productSchema,
} from "@/app/(basic-layout)/submit/schema";
import ProductForm from "@/components/products/ProductForm";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Category } from "@/types/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface EditProductClientProps {
  product: ProductFormValues & { id: string };
  categories: Category[];
  productId: string;
}

export default function EditProductClient({
  product,
  categories,
  productId,
}: EditProductClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name,
      url: product.url,
      tagline: product.tagline,
      description: product.description,
      logoUrl: product.logoUrl,
      appImages: product.appImages,
      categoryIds: product.categoryIds,
      niche: product.niche,
      dr: product.dr,
      da: product.da,
      traffic: product.traffic,
      priceRange: product.priceRange,
      linkType: product.linkType as any,
      turnaroundTime: product.turnaroundTime,
      contactEmail: product.contactEmail,
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await updateProductAsAdminAction({ productId, data });
      if (result.success) {
        toast.success("Site updated successfully!");
        router.replace("/dashboard/sites");
      } else {
        toast.error(result.error || "Failed to update site.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-6xl mx-auto py-4"
      >
        <ProductForm form={form} categories={categories} isEditing />
        <div className="flex justify-end gap-2 py-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
