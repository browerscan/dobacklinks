"use client";

import { ProductFormValues } from "@/app/(basic-layout)/submit/schema";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { Category } from "@/types/product";
import { Bot, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface AutoFillButtonProps {
  form: UseFormReturn<ProductFormValues>;
  categories: Category[];
  disabled?: boolean;
}

interface AutoFillResponse {
  url: string;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string;
  appImages: string[];
  categoryIds: string[];
  niche?: string;
  dr?: number;
  da?: number;
  traffic?: string;
  priceRange?: string;
  linkType?: string;
  turnaroundTime?: string;
  contactEmail?: string;
}

export default function AutoFillButton({
  form,
  categories,
  disabled,
}: AutoFillButtonProps) {
  const router = useRouter();

  const { data: session } = authClient.useSession();
  const user = session?.user as any | undefined;

  const [isLoading, setIsLoading] = useState(false);

  const handleAutoFill = async () => {
    if (!user) {
      toast.error("Please login to use auto-fill");
      router.push("/login");
      return;
    }

    const url = form.getValues("url");

    if (!url) {
      toast.error("Please enter a URL first");
      return;
    }

    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auto-fill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to auto-fill");
      }

      const data: { data: AutoFillResponse } = await response.json();
      const autoFillData = data.data;

      const fieldsToUpdate: Partial<ProductFormValues> = {};

      if (autoFillData.name) fieldsToUpdate.name = autoFillData.name;
      if (autoFillData.tagline) fieldsToUpdate.tagline = autoFillData.tagline;
      if (autoFillData.description)
        fieldsToUpdate.description = autoFillData.description;
      if (autoFillData.logoUrl) fieldsToUpdate.logoUrl = autoFillData.logoUrl;
      if (autoFillData.appImages?.length > 0)
        fieldsToUpdate.appImages = autoFillData.appImages;
      if (autoFillData.niche) fieldsToUpdate.niche = autoFillData.niche;
      if (typeof autoFillData.dr === "number")
        fieldsToUpdate.dr = autoFillData.dr;
      if (typeof autoFillData.da === "number")
        fieldsToUpdate.da = autoFillData.da;
      if (autoFillData.traffic) fieldsToUpdate.traffic = autoFillData.traffic;
      if (autoFillData.priceRange)
        fieldsToUpdate.priceRange = autoFillData.priceRange;
      if (autoFillData.linkType)
        fieldsToUpdate.linkType = autoFillData.linkType as any;
      if (autoFillData.turnaroundTime)
        fieldsToUpdate.turnaroundTime = autoFillData.turnaroundTime;
      if (autoFillData.contactEmail)
        fieldsToUpdate.contactEmail = autoFillData.contactEmail;
      if (autoFillData.categoryIds?.length > 0) {
        // Validate that the category IDs exist in the available categories
        const validCategoryIds = autoFillData.categoryIds.filter((categoryId) =>
          categories.some((cat) => cat.id === categoryId),
        );
        if (validCategoryIds.length > 0) {
          fieldsToUpdate.categoryIds = validCategoryIds.slice(0, 3);
        }
      }

      Object.entries(fieldsToUpdate).forEach(([key, value]) => {
        form.setValue(key as keyof ProductFormValues, value, {
          shouldValidate: true,
        });
      });
    } catch (error) {
      console.error("Auto-fill error:", error);
      toast.error("Auto-fill failed", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleAutoFill}
      disabled={disabled || isLoading}
      className="ml-2 shrink-0 transition-all duration-200 hover:scale-105"
      title="Auto-fill form with AI"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bot className="h-4 w-4" />
      )}
    </Button>
  );
}
