import { siteConfig } from "@/config/site";
import { ProductSubmissionType } from "@/types/product";

export const getSubject = (type: ProductSubmissionType, productName: string) => {
  switch (type) {
    case "free":
      return `🎉 Great news! "${productName}" is now live on ${siteConfig.name}!`;
    case "one_time":
      return `🚀 Great news! "${productName}" is now live on ${siteConfig.name}!`;
    case "monthly_promotion":
      return `🚀 Great news! "${productName}" is now on the top of ${siteConfig.name}!`;
    case "featured":
      return `🚀 Great news! "${productName}" is now featured on ${siteConfig.name}!`;
    case "sponsor":
      return `👑 Great news! "${productName}" is now live on ${siteConfig.name}!`;
    default:
      return `🎉 Great news! "${productName}" is now live on ${siteConfig.name}!`;
  }
};
