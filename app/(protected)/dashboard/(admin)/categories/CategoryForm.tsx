"use client";

import { Category, upsertCategory } from "@/actions/categories/admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconName, IconPicker } from "@/components/ui/icon-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface CategoryFormData {
  id?: string;
  name: string;
  slug: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
}

interface CategoryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  category: Category | null;
}

export function CategoryForm({ isOpen, setIsOpen, category }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: "",
      slug: "",
      icon: "",
      displayOrder: 0,
      isActive: true,
    },
  });

  const watchedName = watch("name");
  const watchedIcon = watch("icon");

  useEffect(() => {
    if (isOpen) {
      if (category) {
        reset({
          ...category,
          icon: category.icon || "",
        });
      } else {
        reset({
          name: "",
          slug: "",
          icon: "",
          displayOrder: 0,
          isActive: true,
        });
      }
    }
  }, [category, reset, isOpen]);

  // Auto-generate slug from name when creating new category
  useEffect(() => {
    if (watchedName && !category) {
      const slug = watchedName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", slug);
    }
  }, [watchedName, setValue, category]);

  // Manual slug generation function (similar to PostForm)
  const generateSlug = () => {
    const name = getValues("name");
    if (!name.trim()) {
      toast.error("Please enter a category name first");
      return;
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setValue("slug", slug, { shouldValidate: true });
  };

  const onSubmit = async (data: CategoryFormData) => {
    // Validation
    if (!data.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!data.slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    const dataToSubmit = category ? { ...data, id: category.id } : data;
    const response = await upsertCategory(dataToSubmit);

    if (response.success) {
      setIsOpen(false);
    } else {
      toast.error(response.error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Create Category"}</DialogTitle>
          <DialogDescription>Fill in the details for the category.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register("name", { required: "Name is required" })}
              placeholder="Category name"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                {...register("slug", { required: "Slug is required" })}
                placeholder="category-slug"
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateSlug}
                disabled={isSubmitting}
              >
                Generate
              </Button>
            </div>
            {errors.slug && <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>}
          </div>

          <div>
            <Label htmlFor="icon">Icon</Label>
            <div>
              <IconPicker
                value={watchedIcon ? (watchedIcon as IconName) : undefined}
                onValueChange={(iconName) => setValue("icon", iconName || "")}
                triggerPlaceholder="Select an icon"
                disabled={isSubmitting}
                categorized={false}
                modal={true}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              {...register("displayOrder", {
                valueAsNumber: true,
                min: {
                  value: 0,
                  message: "Display order must be 0 or greater",
                },
              })}
              disabled={isSubmitting}
            />
            {errors.displayOrder && (
              <p className="text-sm text-red-500 mt-1">{errors.displayOrder.message}</p>
            )}
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>Active</Label>
              <p className="text-sm text-muted-foreground">
                Whether this category is visible to users
              </p>
            </div>
            <Switch
              {...register("isActive")}
              onCheckedChange={(checked: boolean) => setValue("isActive", checked)}
              defaultChecked={true}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
