"use server";

import { actionResponse, ActionResult } from "@/lib/action-response";
import resend from "@/lib/resend";
import * as React from "react";

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID!;

interface SendEmailProps {
  email: string;
  subject: string;
  react: React.ComponentType<any> | React.ReactElement;
  reactProps?: Record<string, any>;
  unsubscribeLink?: string; // Optional custom unsubscribe link
}

interface SendEmailResult {
  messageId: string;
}

export async function sendEmail({
  email,
  subject,
  react,
  reactProps,
  unsubscribeLink,
}: SendEmailProps): Promise<ActionResult<SendEmailResult>> {
  try {
    if (!email) {
      return actionResponse.error("Email is required.");
    }

    if (!resend) {
      return actionResponse.error(
        "Resend is not configured. Check RESEND_API_KEY.",
      );
    }

    // Add user to contacts (non-blocking, don't fail if this fails)
    try {
      await resend.contacts.create({
        audienceId: AUDIENCE_ID,
        email,
      });
    } catch (contactError) {
      console.warn(
        "[sendEmail] Failed to add contact (may already exist):",
        contactError,
      );
    }

    // Send email
    const from = `${process.env.ADMIN_NAME} <${process.env.ADMIN_EMAIL}>`;
    const to = email;

    const emailContent = reactProps
      ? React.createElement(react as React.ComponentType<any>, reactProps)
      : (react as React.ReactElement);

    const headers: Record<string, string> = {};
    if (unsubscribeLink) {
      headers["List-Unsubscribe"] = `<${unsubscribeLink}>`;
      headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      react: emailContent,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    if (error) {
      console.error("[sendEmail] Resend API error:", error);
      return actionResponse.error(`Failed to send email: ${error.message}`);
    }

    return actionResponse.success({ messageId: data?.id || "sent" });
  } catch (error) {
    console.error("[sendEmail] Failed to send email:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return actionResponse.error(`Failed to send email: ${errorMessage}`);
  }
}

export async function removeUserFromContacts(email: string) {
  try {
    if (!email || !resend) {
      return;
    }

    const list = await resend.contacts.list({ audienceId: AUDIENCE_ID });
    const user = list.data?.data.find((item: any) => item.email === email);

    if (!user) {
      return;
    }

    await resend.contacts.remove({
      audienceId: AUDIENCE_ID,
      email: email,
    });
  } catch (error) {
    console.error("Failed to remove user from Resend contacts:", error);
    // Silently fail - we don't care about the result
  }
}
