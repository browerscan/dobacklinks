"use client";

import { subscribeToNewsletter } from "@/actions/newsletter";
import { normalizeEmail, validateEmail } from "@/lib/email";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const normalizedEmailAddress = normalizeEmail(email);
    const { isValid, error: validationError } = validateEmail(
      normalizedEmailAddress,
    );

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
        throw new Error(
          result.error || "An error occurred. Please try again later.",
        );
      }

      setSubscribeStatus("success");
      setEmail("");
      setErrorMessage("");
    } catch (error) {
      setSubscribeStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again later.",
      );
    } finally {
      setTimeout(() => setSubscribeStatus("idle"), 5000);
    }
  };
  return (
    <div className="">
      <h3 className="mb-3 font-semibold">Subscribe to our newsletter</h3>
      <p className="text-sm mb-3">Get the latest news and updates from us.</p>
      <form onSubmit={handleSubscribe} className="flex flex-col gap-2 max-w-64">
        <div className="flex">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="bg-gray-800 text-white px-4 py-2 rounded-l-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={subscribeStatus === "loading"}
          />
          <button
            type="submit"
            disabled={subscribeStatus === "loading"}
            className={cn(
              "bg-indigo-600 px-4 py-2 rounded-r-lg hover:bg-indigo-700",
              subscribeStatus === "loading" && "animate-pulse",
            )}
            aria-label="Subscribe to newsletter"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        {subscribeStatus === "success" && (
          <p className="text-xs text-green-600 mt-1">
            You have successfully subscribed!
          </p>
        )}
        {subscribeStatus === "error" && (
          <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
        )}
      </form>
    </div>
  );
}
