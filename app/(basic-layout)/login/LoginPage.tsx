"use client";

import LoginForm from "@/components/auth/LoginForm";
import { authClient } from "@/lib/auth/auth-client";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

// Separate component for search params handling
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      router.replace(returnUrl);
    }
  }, [router, session?.user, returnUrl]);

  if (session?.user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center flex-1 py-12">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in with the following methods</p>
        </div>

        <LoginForm className="w-[300px]" />
      </div>
    </div>
  );
}

// Wrapper with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
