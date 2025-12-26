"use client";

import { createProductAsAdminAction } from "@/actions/products/admin";
import { ProductFormValues, productSchema } from "@/app/(basic-layout)/submit/schema";
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

interface CreateProductClientProps {
  categories: Category[];
}

const defaultValues: Partial<ProductFormValues> = {
  name: "",
  url: "",
  tagline: "",
  description: "",
  logoUrl: "",
  appImages: [],
  categoryIds: [],
  niche: "",
  dr: 0,
  da: 0,
  traffic: "",
  priceRange: "",
  linkType: "dofollow",
  turnaroundTime: "",
  contactEmail: "",
};

export default function CreateProductClient({ categories }: CreateProductClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createProductAsAdminAction(data);
      if (result.success) {
        toast.success("Site created successfully!");
        router.replace("/dashboard/sites");
      } else {
        toast.error(result.error || "Failed to create site.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-6xl mx-auto py-4">
        <ProductForm form={form} categories={categories} />
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
            Create Site
          </Button>
        </div>
      </form>
    </Form>
  );
}
