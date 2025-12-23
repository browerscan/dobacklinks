"use client";

import { Category, deleteCategory } from "@/actions/categories/admin";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface DeleteCategoryDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  category: Category | null;
}

export function DeleteCategoryDialog({
  isOpen,
  setIsOpen,
  category,
}: DeleteCategoryDialogProps) {
  const [isSubmitting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!category) return;
    setIsDeleting(true);
    try {
      await deleteCategory(category.id);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false);
    }
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            category
            <span className="font-bold"> {category?.name}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
