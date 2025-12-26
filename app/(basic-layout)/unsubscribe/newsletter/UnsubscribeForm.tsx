"use client";

import { unsubscribeFromNewsletter } from "@/actions/newsletter";
import { AlertTriangle, ArrowLeft, CheckCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface UnsubscribeFormProps {
  token: string;
  email: string;
  adminEmail: string;
}

export default function UnsubscribeForm({ token, email, adminEmail }: UnsubscribeFormProps) {
  const [status, setStatus] = useState<"pending" | "loading" | "success" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState("");

  const handleUnsubscribe = async () => {
    setStatus("loading");

    try {
      const result = await unsubscribeFromNewsletter(token);
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(result.error || "An unexpected error occurred. Please try again.");
      }
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      );
    }
  };

  if (status === "success") {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
            <p className="text-green-800 dark:text-green-300 font-medium">
              You have been successfully unsubscribed.
            </p>
          </div>
        </div>

        <div className="bg-muted/50 border border-border p-4 rounded-lg">
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{email}</span>
          </div>
        </div>

        <p className="text-muted-foreground">
          We&apos;re sorry to see you go. You will no longer receive our newsletters.
        </p>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            If this was a mistake, or if you have any questions, please contact us at{" "}
            <Link
              href={`mailto:${adminEmail}`}
              title={adminEmail}
              className="text-primary hover:text-primary/80 ml-1 hover:underline transition-colors"
              target="_blank"
            >
              {adminEmail}
            </Link>
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            title="Back to Home"
            className="inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-300 font-medium">{errorMessage}</p>
          </div>
        </div>

        <p className="text-muted-foreground">
          Please try again, or if the problem persists, contact our support team.
        </p>

        <div className="flex space-x-3">
          <Link
            href="/"
            className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg transition-colors text-center border border-border"
          >
            Back to Home
          </Link>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            If you need help, please contact us at{" "}
            <Link
              href={`mailto:${adminEmail}`}
              title={adminEmail}
              className="text-primary hover:text-primary/80 ml-1 hover:underline transition-colors"
              target="_blank"
            >
              {adminEmail}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-amber-800 dark:text-amber-300 font-medium mb-2">
              Confirm Unsubscription
            </h3>
            <p className="text-amber-700 dark:text-amber-400 text-sm">
              Please confirm that you want to unsubscribe from our newsletter.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 border border-border p-4 rounded-lg">
        <div className="flex items-center space-x-2 text-sm">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{email}</span>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleUnsubscribe}
          disabled={status === "loading"}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:from-red-400 disabled:to-rose-400 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
        >
          {status === "loading" ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Processing...
            </div>
          ) : (
            "Yes, Unsubscribe Me"
          )}
        </button>

        <Link
          href="/"
          className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg transition-colors text-center border border-border"
        >
          Cancel
        </Link>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          You can always subscribe again later through our website.
        </p>
      </div>
    </div>
  );
}
