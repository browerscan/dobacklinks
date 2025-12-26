"use client";

import { GoogleIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { Github, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

interface LoginFormProps {
  className?: string;
}

export default function LoginForm({ className = "" }: LoginFormProps) {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [lastMethod, setLastMethod] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  useEffect(() => {
    setLastMethod(authClient.getLastUsedLoginMethod());
  }, []);

  const signInSocial = async (provider: string) => {
    const callback = new URL(returnUrl, window.location.origin);

    await authClient.signIn.social(
      {
        provider: provider,
        callbackURL: callback.toString(),
        errorCallbackURL: `/redirect-error`,
      },
      {
        onRequest: () => {
          if (provider === "google") {
            setIsGoogleLoading(true);
          } else if (provider === "github") {
            setIsGithubLoading(true);
          }
        },
        onResponse: (ctx) => {
          console.log("onResponse", ctx.response);
        },
        onSuccess: (ctx) => {
          console.log("onSuccess", ctx.data);
          // setIsGoogleLoading(false);
          // setIsGithubLoading(false);
        },
        onError: (ctx) => {
          console.error("social login error", ctx.error.message);
          setIsGoogleLoading(false);
          setIsGithubLoading(false);
          toast.error(`${provider} login failed`, {
            description: ctx.error.message,
          });
        },
      },
    );
  };

  return (
    <div className={`grid gap-4 ${className}`}>
      <Button
        variant="outline"
        onClick={() => signInSocial("google")}
        disabled={isGoogleLoading || isGithubLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 h-4 w-4" />
        )}
        Continue with Google
        {lastMethod === "google" && <Badge className="ml-2 text-xs">Last used</Badge>}
      </Button>
      <Button
        variant="outline"
        onClick={() => signInSocial("github")}
        disabled={isGoogleLoading || isGithubLoading}
      >
        {isGithubLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Github className="mr-2 h-4 w-4" />
        )}
        Continue with Github
        {lastMethod === "github" && <Badge className="ml-2 text-xs">Last used</Badge>}
      </Button>
    </div>
  );
}
