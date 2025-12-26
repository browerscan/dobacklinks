"use client";

import { toggleSaveProductAction } from "@/actions/saved-products";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface SaveButtonProps {
  productId: string;
  initialSaved?: boolean;
  variant?: "icon" | "text" | "combined";
  size?: "sm" | "default" | "lg";
  className?: string;
  showLoginDialog?: () => void;
}

export function SaveButton({
  productId,
  initialSaved = false,
  variant = "icon",
  size = "sm",
  className = "",
  showLoginDialog,
}: SaveButtonProps) {
  const { data: session } = authClient.useSession();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  // Update saved state when session changes
  useEffect(() => {
    if (!session?.user) {
      setIsSaved(false);
    }
  }, [session]);

  const handleToggleSave = useCallback(async () => {
    // Check if user is logged in
    if (!session?.user) {
      if (showLoginDialog) {
        showLoginDialog();
      } else {
        toast.error("Please log in to save products.");
      }
      return;
    }

    setIsLoading(true);

    try {
      const result = await toggleSaveProductAction(productId);

      if (result.success) {
        const saved = result.data?.saved ?? false;
        setIsSaved(saved);
        if (saved) {
          toast.success("Product saved to your items.");
        } else {
          toast.success("Product removed from saved items.");
        }
      } else {
        toast.error(result.error || "Failed to save product.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [productId, session, showLoginDialog]);

  const Icon = isSaved ? BookmarkCheck : Bookmark;
  const text = isSaved ? "Saved" : "Save";
  const sizeClass = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-10 w-10" : "h-9 w-9";

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`${sizeClass} ${isSaved ? "text-primary" : "text-muted-foreground"} ${className}`}
        onClick={handleToggleSave}
        disabled={isLoading}
        title={isSaved ? "Remove from saved" : "Save product"}
      >
        <Icon className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
        <span className="sr-only">{isSaved ? "Remove from saved" : "Save product"}</span>
      </Button>
    );
  }

  if (variant === "text") {
    return (
      <Button
        variant={isSaved ? "secondary" : "outline"}
        size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
        className={`${isSaved ? "text-primary" : ""} ${className}`}
        onClick={handleToggleSave}
        disabled={isLoading}
      >
        <Icon className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
        {text}
      </Button>
    );
  }

  // Combined variant
  return (
    <Button
      variant={isSaved ? "secondary" : "outline"}
      size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
      className={`${isSaved ? "text-primary" : ""} ${className}`}
      onClick={handleToggleSave}
      disabled={isLoading}
    >
      <Icon className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
      <span className="ml-2 hidden sm:inline">{text}</span>
    </Button>
  );
}
