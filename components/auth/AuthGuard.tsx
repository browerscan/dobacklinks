import { getSession } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export async function AuthGuard({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: string;
}) {
  const session = await getSession();

  // dashboard/*
  if (!session) {
    redirect("/login");
  }

  // dashboard/(admin)/*
  if (role && role === "admin" && session.user.role !== role) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
