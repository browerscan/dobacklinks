"use server";

import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { removeUserFromContacts, sendEmail } from "@/actions/resend";
import { siteConfig } from "@/config/site";
import { NewsletterWelcomeEmail } from "@/emails/newsletter-welcome";
import { actionResponse, ActionResult } from "@/lib/action-response";
import { db } from "@/lib/db";
import { newsletter } from "@/lib/db/schema";
import { normalizeEmail, validateEmail } from "@/lib/email";
import { checkRateLimit, RedisFallbackMode } from "@/lib/upstash";
import { headers } from "next/headers";

const NEWSLETTER_RATE_LIMIT = {
  prefix: `${siteConfig.name.trim()}_newsletter_rate_limit`,
  maxRequests: parseInt(process.env.DAY_MAX_SUBMISSIONS || "10"),
  window: "1 d",
};

async function validateRateLimit() {
  const headersList = await headers();
  const ip = headersList.get("x-real-ip") || headersList.get("x-forwarded-for") || "";
  const success = await checkRateLimit(
    ip,
    NEWSLETTER_RATE_LIMIT,
    RedisFallbackMode.MEMORY_FALLBACK,
  );
  if (!success) {
    throw new Error("You have submitted too many times. Please try again later.");
  }
}

/**
 * Generate a cryptographically secure unsubscribe token
 */
function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

export async function subscribeToNewsletter(
  email: string,
): Promise<ActionResult<{ email: string }>> {
  try {
    await validateRateLimit();

    const normalizedEmail = normalizeEmail(email);
    const { isValid, error } = validateEmail(normalizedEmail);

    if (!isValid) {
      return actionResponse.error(error || "Invalid email address.");
    }

    // Generate secure token and store in database
    const unsubscribeToken = generateSecureToken();

    // Upsert newsletter subscription with secure token
    await db
      .insert(newsletter)
      .values({
        email: normalizedEmail,
        unsubscribeToken,
        subscribed: true,
      })
      .onConflictDoUpdate({
        target: newsletter.email,
        set: {
          unsubscribeToken,
          subscribed: true,
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
      });

    const unsubscribeLink = `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe/newsletter?token=${unsubscribeToken}`;

    await sendEmail({
      email: normalizedEmail,
      subject: `Welcome to ${siteConfig.name} newsletter!`,
      react: NewsletterWelcomeEmail,
      reactProps: {
        email: normalizedEmail,
        unsubscribeLink: unsubscribeLink,
      },
    });
    return actionResponse.success({ email: normalizedEmail });
  } catch (error) {
    console.error("failed to subscribe to newsletter:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An error occurred while subscribing to the newsletter.";
    return actionResponse.error(errorMessage);
  }
}

export async function unsubscribeFromNewsletter(
  token: string,
): Promise<ActionResult<{ email: string }>> {
  try {
    await validateRateLimit();

    // Validate token format (should be 64-char hex string)
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return actionResponse.error("Invalid unsubscribe token.");
    }

    // Look up subscription by secure token
    const subscription = await db.query.newsletter.findFirst({
      where: eq(newsletter.unsubscribeToken, token),
    });

    if (!subscription) {
      return actionResponse.error("Invalid or expired unsubscribe token.");
    }

    if (!subscription.subscribed) {
      return actionResponse.success({ email: subscription.email });
    }

    // Mark as unsubscribed and invalidate token
    await db
      .update(newsletter)
      .set({
        subscribed: false,
        unsubscribedAt: new Date(),
        unsubscribeToken: null, // Invalidate token after use
      })
      .where(eq(newsletter.id, subscription.id));

    // Remove from Resend contacts
    await removeUserFromContacts(subscription.email);

    return actionResponse.success({ email: subscription.email });
  } catch (error) {
    console.error("failed to unsubscribe from newsletter:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An error occurred while unsubscribing from the newsletter.";
    return actionResponse.error(errorMessage);
  }
}

/**
 * Get email from unsubscribe token (for display purposes only)
 * Returns null if token is invalid
 */
export async function getEmailFromUnsubscribeToken(token: string): Promise<string | null> {
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    return null;
  }

  const subscription = await db.query.newsletter.findFirst({
    where: eq(newsletter.unsubscribeToken, token),
    columns: { email: true },
  });

  return subscription?.email ?? null;
}
