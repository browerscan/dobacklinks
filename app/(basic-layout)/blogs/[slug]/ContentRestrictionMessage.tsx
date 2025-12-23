import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ArrowRightIcon, LockIcon } from "lucide-react";
import Link from "next/link";

interface ContentRestrictionMessageProps {
  title: string;
  message: string;
  actionText?: string;
  actionLink?: string;
  backText: string;
  backLink: string;
}

export function ContentRestrictionMessage({
  title,
  message,
  actionText,
  actionLink,
  backText,
  backLink,
}: ContentRestrictionMessageProps) {
  return (
    <div className="relative w-full bg-card/50 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden my-10 border border-border/50">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

      <div className="p-10 flex flex-col items-center">
        <div className="flex items-center justify-center mb-8">
          <div className="p-5 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-primary/20">
            <LockIcon className="w-12 h-12 text-primary" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-4">{title}</h2>
        <p className="text-center text-muted-foreground mb-8 max-w-md text-lg">
          {message}
        </p>

        {(actionText || backText) && (
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:flex-1 group"
            >
              <Link
                href={backLink}
                title={backText}
                prefetch={false}
                className="inline-flex items-center justify-center gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                {backText}
              </Link>
            </Button>

            {actionText && actionLink && (
              <Button
                asChild
                size="lg"
                className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white group"
              >
                <Link
                  href={actionLink}
                  title={actionText}
                  className="inline-flex items-center justify-center gap-2"
                  prefetch={false}
                >
                  {actionText}
                  <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500/10 to-transparent"></div>
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-bl from-purple-500/10 to-transparent"></div>
    </div>
  );
}
