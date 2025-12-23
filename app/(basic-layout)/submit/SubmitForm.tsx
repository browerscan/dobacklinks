"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useSubmitFormStore } from "@/stores/submitFormStore";
import { Category } from "@/types/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ProductFormValues, productSchema } from "./schema";
import Step1 from "./Step1_ProductInfo";
import { createFreeProductAction } from "@/actions/products/user";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";

interface SubmitFormProps {
  categories: Category[];
}

export default function SubmitForm({ categories }: SubmitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { formData, setFormData } = useSubmitFormStore();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      ...formData,
      categoryIds: formData.categoryIds?.filter(Boolean) as string[],
    },
  });

  useEffect(() => {
    form.reset({
      ...formData,
      categoryIds: formData.categoryIds?.filter(Boolean) as string[],
    });
  }, [form, formData]);

  const handleSubmit = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Please fill all required fields correctly.");
      return;
    }

    setIsSubmitting(true);
    const values = form.getValues();
    const sanitizedValue = {
      ...values,
      appImages: values.appImages?.filter(Boolean) as string[],
      categoryIds: values.categoryIds?.filter(Boolean) as string[],
    };
    setFormData(sanitizedValue);

    const result = await createFreeProductAction(sanitizedValue);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error || "Submission failed. Try again.");
      return;
    }

    toast.success("Submitted! We will review and list it soon.");
    router.push("/dashboard/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            <div className="space-y-8">
              <Step1 form={form} categories={categories} />
            </div>
          </form>
        </Form>

        <div className="flex items-center justify-end mt-8">
          <Button
            type="button"
            onClick={handleSubmit}
            size="lg"
            className="px-8 text-base transition-all duration-200 hover:scale-105"
            disabled={isSubmitting}
          >
            <div className="flex items-center gap-2">
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit for Review
                </>
              )}
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
