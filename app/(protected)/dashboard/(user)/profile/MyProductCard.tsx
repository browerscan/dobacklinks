"use client";

import { deleteMyProductAction } from "@/actions/products/user";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductWithCategories } from "@/types/product";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ProductCardProps {
  product: ProductWithCategories;
}

const statusBadgeStyle = {
  live: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  pending_review:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  pending_payment:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function MyProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      const result = await deleteMyProductAction(product.id);
      if (result.success) {
        setIsDeleteDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete product.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        `bg-card rounded-xl shadow-md border-2 border-primary/20 dark:border-primary/30 p-4 hover:shadow-lg h-full flex flex-col`,
        product.isFeatured
          ? "border-primary/40 dark:hover:border-primary/50"
          : "border-gray-100 dark:border-gray-800",
      )}
    >
      <div className="flex items-start space-x-4 mb-4 flex-shrink-0">
        {product.logoUrl ? (
          <Image
            src={product.logoUrl}
            alt={`${product.name} logo`}
            width={48}
            height={48}
            className="rounded-xl flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700">
            <span className="text-white font-bold text-lg">
              {product.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3
              className={cn(
                `font-semibold line-clamp-1`,
                product.isFeatured
                  ? "text-primary"
                  : "text-gray-900 dark:text-gray-100",
              )}
            >
              {product.name}
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {product.tagline}
          </p>
        </div>
      </div>

      <div className="flex-grow"></div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
        <div className="flex flex-wrap gap-2">
          {product.categories?.slice(0, 2).map((category) => (
            <span
              key={category.id}
              className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
            >
              #{category.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-3 mt-auto">
        <div className="flex items-center gap-2">
          {product.status && (
            <Badge
              className={cn(
                "capitalize",
                statusBadgeStyle[product.status] || "bg-gray-500",
              )}
              variant="outline"
            >
              {product.status.replace(/_/g, " ")}
            </Badge>
          )}

          {product.submitType && (
            <Badge variant="secondary" className="capitalize">
              {product.submitType.replace(/_/g, " ")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {product.status === "live" && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/sites/${product.slug}`}
                  target="_blank"
                  title={`View ${product.name}`}
                  prefetch={false}
                >
                  View
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dashboard/profile/edit-product/${product.id}`}
                  title={`Edit ${product.name}`}
                  prefetch={false}
                >
                  Edit
                </Link>
              </Button>
            </>
          )}
          {product.status === "cancelled" && (
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your product submission.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}
