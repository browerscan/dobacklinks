import { Card } from "@/components/ui/card";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "Redirect Error",
    description: "There was an error during the redirection process.",
    path: `/redirect-error`,
  });
}

export default async function RedirectErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; message?: string }>;
}) {
  const { code, message } = await searchParams;
  let title = "An Unknown Error Occurred";
  let description = "Please try again later or contact support.";

  if (code === "403") {
    title = "Access Denied";
    description = "You do not have permission to access this page.";
  }

  return (
    <Card className="flex flex-col items-center justify-center m-24">
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{title}</h1>
        <p className="mb-6">{description}</p>
        {message && <p className="mb-6">{message}</p>}
        <Link href="/" title="Go to Home" className="px-4 py-2 highlight-bg text-white rounded-md">
          Go to Home
        </Link>
        <Link
          href="/login"
          title="Go to Login"
          className="ml-4 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Go to Login
        </Link>
      </div>
    </Card>
  );
}
