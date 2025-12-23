"use server";

import { sendEmail } from "@/actions/resend";
import { ProductApprovedEmail } from "@/emails/product-approved";
import { db } from "@/lib/db";
import { user as usersSchema } from "@/lib/db/schema";
import { getSubject } from "@/lib/directory";
import type { ProductSubmissionType } from "@/types/product";
import { eq } from "drizzle-orm";

export type ProductForNotification = {
  userId: string;
  name: string;
  slug: string;
  url: string | null;
  logoUrl: string | null;
  submitType: ProductSubmissionType;
};

/**
 * Sends a product approval notification email to the user.
 * @param product - The product data required for the notification.
 * @throws Will throw an error if sending the email fails for reasons other than an invalid email address.
 */
export async function sendProductApprovedNotification(
  product: ProductForNotification,
) {
  try {
    const userResults = await db
      .select({ email: usersSchema.email })
      .from(usersSchema)
      .where(eq(usersSchema.id, product.userId))
      .limit(1);

    const userData = userResults[0];

    if (!userData || !userData.email) {
      throw new Error(
        `Failed to fetch user information for product ${product.name} (userId: ${product.userId})`,
      );
    }

    const userEmail = userData.email;
    const submitType = product.submitType || "free";

    const unsubscribeToken = Buffer.from(userEmail).toString("base64");
    const unsubscribeLink = `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe/newsletter?token=${unsubscribeToken}`;

    await sendEmail({
      email: userEmail,
      subject: getSubject(submitType as ProductSubmissionType, product.name),
      react: ProductApprovedEmail,
      reactProps: {
        productName: product.name,
        productSlug: product.slug,
        productUrl: product.url || undefined,
        logoUrl: product.logoUrl || undefined,
        submitType: submitType,
        unsubscribeLink,
      },
    });

    console.log(
      `Approval email sent successfully for product "${product.name}" to ${userEmail}`,
    );
  } catch (error) {
    console.error(
      `Failed to send approval email for product "${product.name}":`,
      error,
    );
    // Re-throw to allow the caller to handle it.
    throw error;
  }
}
