import { ProductFormValues } from "@/app/(basic-layout)/submit/schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SubmitFormState {
  formData: Partial<ProductFormValues>;
  setFormData: (data: Partial<ProductFormValues>) => void;
  reset: () => void;
}

const initialState: Partial<ProductFormValues> = {
  name: "",
  url: "",
  tagline: "",
  description: "",
  logoUrl: undefined,
  appImages: undefined,
  categoryIds: [],
  niche: "",
  da: undefined,
  dr: undefined,
  traffic: "",
  priceRange: "",
  linkType: "dofollow",
  turnaroundTime: "",
  contactEmail: "",
};

export const useSubmitFormStore = create<SubmitFormState>()(
  persist(
    (set) => ({
      formData: initialState,
      setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
      reset: () => set({ formData: initialState }),
    }),
    {
      name: "submit-form-storage",
      storage: createJSONStorage(() => localStorage),
      // Set cookie options if you were using cookie storage
      // cookieOptions: {
      //   expires: 7, // 7 days
      // },
    },
  ),
);
