/**
 * Discord notification utilities for product submissions
 */

import { ProductFormValues } from "@/app/(basic-layout)/submit/schema";
import { getErrorMessage } from "@/lib/error-utils";

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  timestamp?: string;
  footer?: {
    text: string;
  };
  thumbnail?: {
    url: string;
  };
}

export interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
}

/**
 * Sends a Discord notification for new product submission
 */
export async function sendProductSubmissionNotification({
  productData,
  productId,
  submitType,
  status,
  amount = 0,
}: {
  productData: ProductFormValues;
  productId: string;
  submitType:
    | "free"
    | "monthly_promotion"
    | "featured"
    | "sponsor"
    | "one_time";
  status?: string;
  amount?: number;
}): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.DISCORD_SUBMIT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("Discord webhook URL not configured");
    return { success: false, error: "Discord webhook URL not configured" };
  }

  try {
    const isPaidSubmission = submitType !== "free" && amount > 0;
    const embed: DiscordEmbed = {
      title: isPaidSubmission
        ? "💰 Product Payment Completed"
        : "New Product Submission",
      color:
        submitType === "free"
          ? 0x00ff00
          : isPaidSubmission
            ? 0xffd700
            : 0x0099ff, // Green for free, gold for paid, blue for pending
      fields: [
        {
          name: "Product Name",
          value: productData.name,
          inline: true,
        },
        {
          name: "Website URL",
          value: productData.url,
          inline: true,
        },
        {
          name: "Submission Type",
          value: submitType,
          inline: true,
        },
        ...(isPaidSubmission
          ? [
              {
                name: "💵 Payment Amount",
                value: `$${amount.toFixed(2)} USD`,
                inline: true,
              },
            ]
          : []),
        ...(status
          ? [
              {
                name: "Status",
                value: status,
                inline: true,
              },
            ]
          : []),
        {
          name: "Tagline",
          value: productData.tagline || "None",
          inline: false,
        },
        {
          name: "Price",
          value: productData.priceRange || "Contact",
          inline: true,
        },
        {
          name: "DR / Traffic",
          value: `${productData.dr ?? "—"} / ${productData.traffic || "N/A"}`,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: `Product ID: ${productId}`,
      },
    };

    // Add logo thumbnail if available
    if (productData.logoUrl) {
      embed.thumbnail = {
        url: productData.logoUrl,
      };
    }

    const payload: DiscordWebhookPayload = {
      embeds: [embed],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Discord webhook failed:", response.status, errorText);
      return {
        success: false,
        error: `Discord webhook failed: ${response.status} ${errorText}`,
      };
    }

    console.log(
      "Discord notification sent successfully for product:",
      productId,
    );
    return { success: true };
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Error sending Discord notification:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
