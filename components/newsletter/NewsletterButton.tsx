"use client";

import { subscribeToNewsletter } from "@/actions/newsletter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { normalizeEmail, validateEmail } from "@/lib/email";
import { cn } from "@/lib/utils";
import { Check, Mail, Send, X } from "lucide-react";
import { useState } from "react";

export default function NewsletterButton() {
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

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
      // Close dialog after successful subscription
      setTimeout(() => {
        setIsOpen(false);
        setSubscribeStatus("idle");
      }, 2000);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-fit h-11 rounded-xl px-8 py-2 bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-transparent hover:border-primary/20"
          variant="default"
        >
          <Mail className="w-4 h-4 mr-2" />
          Newsletter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Subscribe to Newsletter
          </DialogTitle>
          <DialogDescription>
            Stay updated with the latest news and updates. We respect your
            privacy and won&apos;t spam you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubscribe} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <div className="flex gap-2">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className={cn(
                  "flex-1 px-3 py-2 text-sm bg-background border border-input rounded-md",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "placeholder:text-muted-foreground",
                  subscribeStatus === "loading" && "opacity-50",
                )}
                disabled={subscribeStatus === "loading"}
              />
              <Button
                type="submit"
                disabled={subscribeStatus === "loading" || !email}
                className={cn(subscribeStatus === "loading" && "animate-pulse")}
              >
                {subscribeStatus === "loading" ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : subscribeStatus === "success" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Status Messages */}
          {subscribeStatus === "success" && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
              <Check className="w-4 h-4" />
              <span>Successfully subscribed! Thank you.</span>
            </div>
          )}
          {subscribeStatus === "error" && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
              <X className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
