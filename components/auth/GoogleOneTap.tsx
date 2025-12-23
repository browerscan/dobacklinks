"use client";

import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export function GoogleOneTap() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const initializeOneTap = useCallback(async () => {
    try {
      await authClient.oneTap({
        fetchOptions: {
          onSuccess: () => {
            window.location.reload();
          },
          onError: (context) => {
            console.error("One Tap Error:", context.error);
          },
        },
        onPromptNotification: (notification) => {
          console.log("One Tap Prompt Notification:", notification);
        },
      });
    } catch (error) {
      console.error("One Tap Initialize Error:", error);
    }
  }, []);

  useEffect(() => {
    if (isPending || session || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      return;
    }
    initializeOneTap();
  }, [isPending, session, initializeOneTap]);

  return null;
}
