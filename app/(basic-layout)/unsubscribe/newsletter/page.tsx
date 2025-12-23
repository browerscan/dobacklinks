import { getEmailFromUnsubscribeToken } from "@/actions/newsletter";
import UnsubscribeForm from "./UnsubscribeForm";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function validateToken(token: string) {
  // Validate token format: 64-char hex string
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    return { isValid: false, email: "", error: "Invalid token format" };
  }

  // Look up email from secure token in database
  const email = await getEmailFromUnsubscribeToken(token);

  if (!email) {
    return { isValid: false, email: "", error: "Invalid or expired token" };
  }

  return { isValid: true, email, error: "" };
}

export default async function Page(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const token = searchParams.token as string;

  let tokenValidation = { isValid: false, email: "", error: "" };
  if (!token) {
    tokenValidation.error = "No unsubscribe token provided.";
  } else {
    tokenValidation = await validateToken(token);
    if (!tokenValidation.isValid) {
      tokenValidation.error =
        tokenValidation.error ||
        "The unsubscribe token is invalid or has expired.";
    }
  }

  return (
    <div className=" py-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden backdrop-blur-sm">
          <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 p-6 text-center">
            <h1 className="text-2xl font-bold text-white">
              Unsubscribe from Newsletter
            </h1>
          </div>

          <div className="p-6">
            {tokenValidation.isValid ? (
              <UnsubscribeForm
                token={token}
                email={tokenValidation.email}
                adminEmail={process.env.ADMIN_EMAIL || ""}
              />
            ) : (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                  <p className="text-red-800 dark:text-red-300 font-medium">
                    {tokenValidation.error}
                  </p>
                </div>

                <p className="text-muted-foreground">
                  If you believe this is a mistake, or if you continue to
                  receive emails, please contact us.
                </p>

                <div className="pt-4 mt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Contact us at:
                    <a
                      href={`mailto:${process.env.ADMIN_EMAIL}`}
                      title={process.env.ADMIN_EMAIL}
                      className="text-primary hover:text-primary/80 ml-1 hover:underline transition-colors"
                      target="_blank"
                    >
                      {process.env.ADMIN_EMAIL}
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
