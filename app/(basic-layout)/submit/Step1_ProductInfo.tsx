"use client";

import ProductForm from "@/components/products/ProductForm";
import { Category } from "@/types/product";
import { UseFormReturn } from "react-hook-form";
import { ProductFormValues } from "./schema";

interface Step1Props {
  form: UseFormReturn<ProductFormValues>;
  categories: Category[];
}

export default function Step1({ form, categories }: Step1Props) {
  return <ProductForm form={form} categories={categories} />;
}
