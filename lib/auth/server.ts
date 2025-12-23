import "server-only";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userSchema } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const getSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
};

/**
 * Pure boolean check for admin status - use in server actions
 * Returns false for unauthenticated users (no redirect)
 */
export const isAdminCheck = async (): Promise<boolean> => {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return false;
  }

  const userDataResults = await db
    .select({ role: userSchema.role })
    .from(userSchema)
    .where(eq(userSchema.id, user.id))
    .limit(1);

  const userData = userDataResults[0];
  return !!userData && userData.role === "admin";
};

/**
 * Redirect-based admin check - use for page protection
 * Redirects to /login if not authenticated, /unauthorized if not admin
 */
export const requireAdmin = async (): Promise<void> => {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    redirect("/login");
  }

  const isAdmin = await isAdminCheck();
  if (!isAdmin) {
    redirect("/unauthorized");
  }
};

/**
 * @deprecated Use isAdminCheck() for server actions or requireAdmin() for pages
 * Kept for backward compatibility - now returns boolean without redirect
 */
export const isAdmin = isAdminCheck;
