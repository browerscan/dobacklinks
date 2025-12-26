"use client";

import { subscribeToNewsletter } from "@/actions/newsletter";
import { normalizeEmail, validateEmail } from "@/lib/email";
import { cn } from "@/lib/utils";
import { Check, Send, X } from "lucide-react";
import { useState } from "react";

export default function InlineNewsletter() {
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const normalizedEmailAddress = normalizeEmail(email);
    const { isValid, error: validationError } = validateEmail(normalizedEmailAddress);

    if (!isValid) {
      setSubscribeStatus("error");
      setErrorMessage(validationError || "Invalid email address.");
      setTimeout(() => setSubscribeStatus("idle"), 5000);
      return;
    }

    try {
      setSubscribeStatus("loading");

      const result = await subscribeToNewsletter(normalizedEmailAddress);

      if (!result.success) {
        throw new Error(result.error || "An error occurred. Please try again later.");
      }

      setSubscribeStatus("success");
      setEmail("");
      setErrorMessage("");
    } catch (error) {
      setSubscribeStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "An error occurred. Please try again later.",
      );
    } finally {
      setTimeout(() => setSubscribeStatus("idle"), 5000);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* <div className="flex items-center gap-2 mb-2">
        <Mail className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Subscribe to Newsletter</span>
      </div> */}

      <form onSubmit={handleSubscribe} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to subscribe newsletter"
            required
            className={cn(
              "flex-1 h-11 px-4 py-2 text-sm bg-background border border-input rounded-xl",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "placeholder:text-muted-foreground",
              subscribeStatus === "loading" && "opacity-50",
              subscribeStatus === "success" && "border-green-500",
              subscribeStatus === "error" && "border-red-500",
            )}
            disabled={subscribeStatus === "loading"}
          />
          <button
            type="submit"
            disabled={subscribeStatus === "loading" || !email}
            className={cn(
              "h-11 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium",
              "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2 transition-colors",
              subscribeStatus === "loading" && "animate-pulse",
            )}
            aria-label="Subscribe to newsletter"
          >
            {subscribeStatus === "loading" ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Subscribing...</span>
              </>
            ) : subscribeStatus === "success" ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Subscribed!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Subscribe</span>
              </>
            )}
          </button>
        </div>

        {/* Status Messages */}
        {subscribeStatus === "success" && (
          <div className="flex items-center gap-2 text-green-600 text-xs bg-green-50 dark:bg-green-950/20 p-2 rounded-lg">
            <Check className="w-3 h-3" />
            <span>Successfully subscribed! Thank you for joining our newsletter.</span>
          </div>
        )}
        {subscribeStatus === "error" && (
          <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 dark:bg-red-950/20 p-2 rounded-lg">
            <X className="w-3 h-3" />
            <span>{errorMessage}</span>
          </div>
        )}
      </form>
    </div>
  );
}
