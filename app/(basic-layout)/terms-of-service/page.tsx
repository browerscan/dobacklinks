import { siteConfig } from "@/config/site";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "Terms of Service",
    description: "Terms and conditions for using our platform.",
    path: `/terms-of-service`,
  });
}

export default function TermsOfServicePage() {
  return (
    <div className="bg-secondary/20 py-8 sm:py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="bg-background rounded-xl border p-6 shadow-sm sm:p-8 dark:border-zinc-800">
          <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Terms of Service</h1>

          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-xl font-semibold">Introduction</h2>
              <p className="mb-3">
                Welcome to {siteConfig.name} (hereinafter referred to as "we," "our platform," or "
                {siteConfig.name}"). The following Terms of Service ("Terms") set forth the
                conditions for your access to and use of our tool directory platform, including
                browsing tools, submitting tools, and using related services. By accessing our
                website or services, you agree to these Terms. Please read them carefully.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">Account Registration</h2>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">1. Account Creation</h3>
                <p className="mb-3">
                  When using certain services, you may need to create an account. You commit to
                  providing accurate, complete, and up-to-date information. You are responsible for
                  maintaining the security of your account, including protecting your password and
                  limiting access to your computer.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">2. Account Responsibility</h3>
                <p className="mb-3">
                  You are responsible for all activities that occur under your account, whether or
                  not these activities are authorized by you. If you suspect unauthorized use of
                  your account, you must notify us immediately.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">Conditions of Service Use</h2>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">1. Lawful Use</h3>
                <p className="mb-3">
                  You agree not to use our platform for any illegal or unauthorized activities,
                  including but not limited to:
                </p>
                <ul className="mb-3 list-disc space-y-1 pl-6">
                  <li>Violating any applicable laws, regulations, or rules</li>
                  <li>
                    Infringing on the intellectual property rights, privacy rights, or other rights
                    of third parties
                  </li>
                  <li>Submitting false, misleading, or spam content about tools</li>
                  <li>
                    Distributing malware, viruses, or other harmful code through tool submissions or
                    links
                  </li>
                  <li>Attempting unauthorized access to our systems or other users' accounts</li>
                  <li>
                    Manipulating ratings, reviews, or rankings through fake accounts or automated
                    means
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">2. Tool Submission Guidelines</h3>
                <p className="mb-3">When submitting tools to our directory, you agree to:</p>
                <ul className="mb-3 list-disc space-y-1 pl-6">
                  <li>Provide accurate and truthful information about your tool</li>
                  <li>Only submit tools that you own, represent, or have authorization to list</li>
                  <li>Ensure submitted tools comply with applicable laws and ethical standards</li>
                  <li>
                    Not submit tools that contain malicious software, illegal content, or violate
                    third-party rights
                  </li>
                  <li>Keep tool information updated and notify us of significant changes</li>
                  <li>
                    Respect our review process and editorial decisions regarding listing approval
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">3. Content Moderation and Removal</h3>
                <p className="mb-3">We reserve the right to:</p>
                <ul className="mb-3 list-disc space-y-1 pl-6">
                  <li>Review, approve, reject, or remove any tool submissions at our discretion</li>
                  <li>
                    Modify or edit tool listings for accuracy, clarity, or compliance with our
                    guidelines
                  </li>
                  <li>Remove tools that violate these terms or become inactive/inaccessible</li>
                  <li>Suspend or terminate accounts that violate our community guidelines</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">
                  4. Service Modifications and Termination
                </h3>
                <p className="mb-3">
                  We reserve the right to modify or terminate parts or all of our directory services
                  at any time, with or without prior notice. This includes changes to listing
                  features, pricing, or platform functionality. We are not liable to you or any
                  third party for any modification, suspension, or termination of the services.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">5. Usage Limitations</h3>
                <p className="mb-3">
                  Some service features may be subject to usage limitations, especially for free
                  listings or during trial periods. Exceeding these limitations may require
                  upgrading to a premium listing plan or waiting until the next reset period.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">Payment Terms</h2>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">1. Listing Plans and Pricing</h3>
                <p className="mb-3">
                  We offer various listing plans, including free basic listings and premium featured
                  listings with enhanced visibility and additional features. Premium listing prices
                  and terms are clearly displayed during the submission process. We reserve the
                  right to change pricing at any time, but will provide advance notice to active
                  paid customers when practical.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">2. Payment Processing</h3>
                <p className="mb-3">
                  Payments for premium services (guest posting, data exports) are processed via
                  PayPal or cryptocurrency (USDT). Manual invoices are provided upon request. You
                  agree to complete payment before service delivery begins.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">3. Refunds and Cancellations</h3>
                <p className="mb-3">
                  Paid services may be cancelled by contacting us. Unless required by local law or
                  due to our service failure, payments are generally non-refundable given the nature
                  of directory services and the immediate exposure or work provided.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">Intellectual Property</h2>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">1. Our Platform Content</h3>
                <p className="mb-3">
                  All content on {siteConfig.name}, including but not limited to platform design,
                  code, interfaces, logos, branding, and organizational structure, is owned by us
                  and is protected by copyright, trademark, and other intellectual property laws.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">2. Tool Submissions and User Content</h3>
                <p className="mb-3">
                  For tool information, descriptions, images, and other content you submit to our
                  directory, you retain all ownership rights. By submitting content, you grant us a
                  worldwide, royalty-free, non-exclusive license to use, reproduce, modify, display,
                  and distribute such content for the purpose of operating our directory platform,
                  including but not limited to:
                </p>
                <ul className="mb-3 list-disc space-y-1 pl-6">
                  <li>Displaying your tool in our directory and search results</li>
                  <li>Creating promotional materials featuring submitted tools</li>
                  <li>Optimizing content for search engines and user discovery</li>
                  <li>Generating platform statistics and category insights</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">3. Third-Party Tool Rights</h3>
                <p className="mb-3">
                  We respect the intellectual property rights of the tools listed in our directory.
                  All tool names, logos, descriptions, and related content remain the property of
                  their respective owners. Our directory serves as a promotional platform and does
                  not claim ownership of listed tools.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">4. Feedback and Suggestions</h3>
                <p className="mb-3">
                  For any feedback, comments, or suggestions you provide about our platform, you
                  grant us the right to use such feedback without restriction and without
                  compensation to you for platform improvement purposes.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">Disclaimers</h2>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">1. Platform Services Provided "As Is"</h3>
                <p className="mb-3">
                  Our directory platform is provided "as is" and "as available" without warranties
                  of any kind, either express or implied. We do not guarantee that our platform will
                  be error-free, secure, or uninterrupted.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">
                  2. Tool Listings and Third-Party Services
                </h3>
                <p className="mb-3">
                  Our directory contains information about and links to third-party tools, websites,
                  and services. We are not responsible for:
                </p>
                <ul className="mb-3 list-disc space-y-1 pl-6">
                  <li>The accuracy, functionality, or quality of listed tools</li>
                  <li>The availability, security, or performance of third-party tools</li>
                  <li>
                    Any transactions, disputes, or issues arising from your use of listed tools
                  </li>
                  <li>The content, privacy practices, or business practices of tool providers</li>
                  <li>Any damages or losses resulting from your use of listed tools</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">3. No Endorsement</h3>
                <p className="mb-3">
                  Inclusion in our directory does not constitute endorsement, recommendation, or
                  guarantee of any tool's quality, safety, or suitability for your specific needs.
                  Users should conduct their own research and due diligence before using any listed
                  tools.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">Limitation of Liability</h2>
              <p className="mb-3">
                To the maximum extent permitted by law, {siteConfig.name} and its suppliers,
                partners, and licensors will not be liable for any indirect, incidental, special,
                consequential, or punitive damages, including but not limited to loss of profits,
                loss of data, business interruption, or other commercial damages arising from:
              </p>
              <ul className="mb-3 list-disc space-y-1 pl-6">
                <li>Your use of our directory platform or listed tools</li>
                <li>Any inaccuracies in tool listings or information</li>
                <li>Interactions with third-party tools or their providers</li>
                <li>Any interruptions or technical issues with our platform</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">General Provisions</h2>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">1. Entire Agreement</h3>
                <p className="mb-3">
                  These Terms constitute the entire agreement between you and {siteConfig.name}{" "}
                  regarding the use of our directory platform and supersede all prior or
                  contemporaneous communications, proposals, and understandings, whether oral or
                  written.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">2. Modification of Terms</h3>
                <p className="mb-3">
                  We may modify these Terms from time to time. Modified Terms will be effective when
                  posted on our website. Your continued use of our platform indicates your
                  acceptance of the modified Terms.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-lg font-medium">3. Contact Information</h3>
                <p className="mb-3">
                  If you have any questions or comments about these Terms, please contact us:
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
              </div>
            </section>

            <section>
              <p className="mb-3 text-center">Thank you for using {siteConfig.name}!</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
