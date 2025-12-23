import { siteConfig } from "@/config/site";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "Privacy Policy",
    description: "How we collect and use your information.",
    path: `/privacy-policy`,
  });
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-secondary/20 py-8 sm:py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="bg-background rounded-xl border p-6 shadow-sm sm:p-8 dark:border-zinc-800">
          <h1 className="mb-6 text-2xl font-bold sm:text-3xl">
            Privacy Policy
          </h1>

          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-xl font-semibold">Introduction</h2>
              <p className="mb-3">
                Welcome to {siteConfig.name} (hereinafter referred to as "we,"
                "our platform," or "{siteConfig.name}"). We are committed to
                protecting your privacy and personal information. This Privacy
                Policy explains how we collect, use, store, and protect your
                personal information when you use our tool directory platform.
                By accessing our website and services, you agree to the
                practices described in this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">
                Information We Collect
              </h2>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">
                  1. Information You Provide Directly
                </h3>
                <p className="mb-3">
                  When you use our tool directory platform, we may collect the
                  following types of information:
                </p>
                <ul className="mb-3 list-disc space-y-1 pl-6">
                  <li>
                    <strong>Account Information</strong>: Including your name,
                    email address, avatar, and other information you provide
                    when registering or updating your account
                  </li>
                  <li>
                    <strong>Tool Submission Information</strong>: Details about
                    tools you submit including tool name, description, category,
                    pricing, website URL, logo/images, and contact information
                  </li>
                  <li>
                    <strong>Payment Information</strong>: If you purchase
                    premium services (guest posting, data exports), we collect
                    necessary payment details through PayPal or cryptocurrency
                    (USDT). We do not store complete payment card details.
                  </li>
                  <li>
                    <strong>Contact Information</strong>: Information you
                    provide when communicating with us via email, forms, or
                    other means
                  </li>
                  <li>
                    <strong>Newsletter Subscription</strong>: Email address and
                    preferences when you subscribe to our newsletter about new
                    tools and platform updates
                  </li>
                  <li>
                    <strong>Reviews and Ratings</strong>: Comments, ratings, and
                    feedback you provide about tools listed on our platform
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">
                  2. Anonymous Information Collected Automatically
                </h3>
                <p className="mb-3">
                  When you visit or use our services, we may automatically
                  collect anonymous information:
                </p>
                <ul className="mb-3 list-disc space-y-1 pl-6">
                  <li>
                    <strong>Device Information</strong>: Including your IP
                    address, browser type, operating system, and device
                    identifiers
                  </li>
                  <li>
                    <strong>Usage Data</strong>: Information about how you use
                    our services, including access times, pages viewed, and
                    interaction methods
                  </li>
                  <li>
                    <strong>Cookies and Similar Technologies</strong>: We use
                    cookies and similar technologies to collect information and
                    enhance your user experience
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">
                How We Use Your Information
              </h2>
              <p className="mb-3">
                We use the collected information for the following purposes:
              </p>
              <ul className="mb-3 list-disc space-y-1 pl-6">
                <li>
                  <strong>Directory Services</strong>: Displaying submitted
                  tools in our directory, managing tool categories, processing
                  submissions, and facilitating tool discovery
                </li>
                <li>
                  <strong>Platform Management</strong>: Managing your account,
                  processing payments for premium listings, providing customer
                  support, and maintaining our tool directory
                </li>
                <li>
                  <strong>Quality Control</strong>: Reviewing and moderating
                  tool submissions to ensure quality and relevance for our
                  community
                </li>
                <li>
                  <strong>Analytics and Improvement</strong>: Analyzing usage
                  patterns, optimizing search functionality, and developing new
                  features to enhance tool discovery
                </li>
                <li>
                  <strong>Communication</strong>: Contacting you about your
                  submissions, account updates, platform changes, or community
                  guidelines
                </li>
                <li>
                  <strong>Community Building</strong>: Facilitating connections
                  between tool creators and users, managing reviews and feedback
                  systems
                </li>
                <li>
                  <strong>Security and Compliance</strong>: Detecting and
                  preventing spam submissions, abuse, and fraudulent activities
                </li>
                <li>
                  <strong>Marketing</strong>: Sending newsletters about new
                  tools, platform features, and relevant industry updates (with
                  your consent)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">
                Information Sharing
              </h2>
              <p className="mb-3">
                We do not sell your personal information. We may share your
                information in the following circumstances:
              </p>
              <ul className="mb-3 list-disc space-y-1 pl-6">
                <li>
                  <strong>Public Directory</strong>: Tool information you submit
                  (name, description, category, website, etc.) will be publicly
                  displayed in our directory for discovery purposes
                </li>
                <li>
                  <strong>Service Providers</strong>: With third-party service
                  providers who perform services on our behalf, such as payment
                  processing, cloud storage (Supabase, Cloudflare R2), email
                  services (Resend), and analytics
                </li>
                <li>
                  <strong>Tool Verification</strong>: We may contact submitted
                  tools' websites or teams to verify authenticity and gather
                  additional information
                </li>
                <li>
                  <strong>Compliance and Legal Requirements</strong>: When we
                  believe in good faith that disclosure is required by law or to
                  protect our rights, security, or those of our users
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">
                Data Storage and Security
              </h2>
              <p className="mb-3">
                We implement reasonable technical and organizational measures to
                protect your personal information:
              </p>
              <ul className="mb-3 list-disc space-y-1 pl-6">
                <li>
                  All payment information is processed through secure payment
                  processors; we do not directly store complete payment card
                  details
                </li>
                <li>We use SSL/TLS encryption to protect data transmission</li>
                <li>
                  We regularly review our information collection, storage, and
                  processing practices, including physical security measures
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">
                Your Rights and Choices
              </h2>
              <p className="mb-3">
                Depending on applicable laws in your region, you may have the
                following rights:
              </p>
              <ul className="mb-3 list-disc space-y-1 pl-6">
                <li>
                  <strong>Access</strong>: Obtain a copy of your personal
                  information that we hold
                </li>
                <li>
                  <strong>Correction</strong>: Update or correct your personal
                  information
                </li>
                <li>
                  <strong>Deletion</strong>: Request deletion of your personal
                  information in certain circumstances
                </li>
                <li>
                  <strong>Objection</strong>: Object to our processing of your
                  personal information
                </li>
                <li>
                  <strong>Restriction</strong>: Request that we limit the
                  processing of your personal information
                </li>
                <li>
                  <strong>Data Portability</strong>: Obtain an electronic copy
                  of information you have provided to us
                </li>
              </ul>

              <div className="mb-3">
                <h3 className="mb-2 text-lg font-medium">
                  How to Exercise Your Rights
                </h3>
                <p className="mb-3">
                  To exercise any of these rights, please contact us at{" "}
                  {siteConfig.socialLinks?.email && (
                    <a
                      href={`mailto:${siteConfig.socialLinks.email}`}
                      className="text-primary hover:underline"
                    >
                      {siteConfig.socialLinks.email}
                    </a>
                  )}
                  . We will respond to your request within a reasonable
                  timeframe.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">Cookie Policy</h2>
              <p className="mb-3">
                We use cookies and similar technologies to collect information
                and improve your experience. Cookies are small text files placed
                on your device that help us provide a better user experience.
                The types of cookies we use include:
              </p>
              <ul className="mb-3 list-disc space-y-1 pl-6">
                <li>
                  <strong>Necessary Cookies</strong>: Essential for the basic
                  functionality of the website
                </li>
                <li>
                  <strong>Preference Cookies</strong>: Allow us to remember your
                  settings and preferences
                </li>
                <li>
                  <strong>Statistical Cookies</strong>: Help us understand how
                  visitors interact with the website
                </li>
                <li>
                  <strong>Marketing Cookies</strong>: Used to track visitors'
                  activities on the website
                </li>
              </ul>
              <p className="mb-3">
                You can control or delete cookies by changing your browser
                settings. Please note that disabling certain cookies may affect
                your experience on our website.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">Children's Privacy</h2>
              <p className="mb-3">
                Our services are not directed to children under 13 years of age.
                We do not knowingly collect personal information from children
                under 13. If you discover that we may have collected personal
                information from a child under 13, please contact us, and we
                will promptly take steps to delete that information.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">
                International Data Transfers
              </h2>
              <p className="mb-3">
                We may process and store your personal information globally,
                including in countries outside your country of residence. In
                such cases, we will take appropriate measures to ensure your
                personal information receives adequate protection.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">
                Updates to This Privacy Policy
              </h2>
              <p className="mb-3">
                We may update this Privacy Policy from time to time. When we
                make significant changes, we will post the revised policy on our
                website and update the "Last Updated" date at the top. We
                encourage you to review this policy periodically to stay
                informed about how we protect your information.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">Contact Us</h2>
              <p className="mb-3">
                If you have any questions, comments, or requests regarding this
                Privacy Policy or our privacy practices, please contact us
                through:
              </p>
              <ul className="mb-3 list-disc space-y-1 pl-6">
                {siteConfig.socialLinks?.discord && (
                  <li>
                    <strong>Discord</strong>:{" "}
                    <a
                      href={siteConfig.socialLinks.discord}
                      className="text-primary hover:underline"
                    >
                      Discord
                    </a>
                  </li>
                )}
                {siteConfig.socialLinks?.email && (
                  <li>
                    <strong>Email</strong>:{" "}
                    <a
                      href={`mailto:${siteConfig.socialLinks.email}`}
                      className="text-primary hover:underline"
                    >
                      {siteConfig.socialLinks.email}
                    </a>
                  </li>
                )}
              </ul>
              <p className="mb-3">
                We will respond to your inquiries as soon as possible.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
