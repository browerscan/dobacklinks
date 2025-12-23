import { getActiveCategories } from "@/actions/categories/user";
import SubmitFAQ from "@/components/faq/SubmitFAQ";
import { siteConfig } from "@/config/site";
import { constructMetadata } from "@/lib/metadata";
import { Category } from "@/types/product";
import { Metadata } from "next";
import SubmitForm from "./SubmitForm";

export const dynamicParams = true;

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "Submit a Guest Post Site",
    description: `Submit your guest post site to ${siteConfig.name}. Get discovered by marketers searching for publishers and boost inbound pitches.`,
    path: `/submit`,
  });
}

export default async function SubmitProductPage() {
  const categoriesResponse = await getActiveCategories();
  const categories = categoriesResponse.success
    ? (categoriesResponse.data ?? [])
    : [];

  return (
    <div className="flex flex-col items-center justify-center pt-8 max-w-7xl mx-auto px-4">
      <div className="flex flex-col gap-4 items-center text-center">
        <h1 className="text-3xl font-bold sm:text-5xl md:text-6xl">
          <span className="bg-clip-text bg-gradient-to-b from-foreground to-muted-foreground text-transparent">
            Submit a Guest Post Site
          </span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg sm:text-xl leading-relaxed">
          List your site and attract marketers who are ready to publish. Free
          submission, fast manual review, PayPal-friendly.
        </p>
      </div>

      {/* Why Submit Section */}
      <div className="max-w-4xl mx-auto mt-12 mb-8 text-left">
        <h2 className="text-3xl font-bold mb-6">
          Why Publishers Win When They List Here
        </h2>
        <p className="text-lg text-muted-foreground mb-4">
          Simple math: 55% of websites have zero backlinks. That's millions of
          sites invisible to Google. Meanwhile, you're sitting on a domain with
          authority. List it here, and marketers find you—not the other way
          around.
        </p>
        <p className="text-lg text-muted-foreground mb-4">
          Guest posting is the #2 most effective link building tactic, according
          to industry data. But publishers waste hours chasing down leads. We
          flip the script. You list once. Marketers with budgets search your
          niche. You get inbound pitches while you sleep.
        </p>
        <p className="text-lg text-muted-foreground">
          If your site has a DA 35+, you're already in the top 8% globally.
          That's rare. Don't hide it. Sites on our directory get discovered by
          real buyers—people who understand the value of quality links and pay
          fair rates.
        </p>
      </div>

      {/* Benefits List */}
      <div className="max-w-4xl mx-auto mb-12">
        <h2 className="text-3xl font-bold mb-6">What You Get (For Free)</h2>
        <ul className="space-y-3 text-lg text-muted-foreground">
          <li className="flex items-start">
            <span className="mr-3 text-green-500 font-bold">✓</span>
            <span>
              <strong>Instant visibility</strong> — Marketers filter by niche,
              DR, and traffic. If you match, they see you first.
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 text-green-500 font-bold">✓</span>
            <span>
              <strong>Inbound pitches</strong> — Stop cold outreach. Let buyers
              come to you with their content and budget ready.
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 text-green-500 font-bold">✓</span>
            <span>
              <strong>Zero cost</strong> — No subscription. No hidden fees. Free
              to list, free to update, forever.
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 text-green-500 font-bold">✓</span>
            <span>
              <strong>PayPal-friendly</strong> — Collect payments however you
              want. We don't take a cut.
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 text-green-500 font-bold">✓</span>
            <span>
              <strong>Fast approval</strong> — 24-48 hour manual review. We
              check your site is live and your niche is real. That's it.
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 text-green-500 font-bold">✓</span>
            <span>
              <strong>Control pricing</strong> — Set your own rates. Update
              anytime from your dashboard. Keep 100% of what you earn.
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 text-green-500 font-bold">✓</span>
            <span>
              <strong>SimilarWeb traffic data</strong> — We display your monthly
              visits, bounce rate, and traffic sources to prove your value.
            </span>
          </li>
        </ul>
      </div>

      {/* How It Works */}
      <div className="max-w-4xl mx-auto mb-12">
        <h2 className="text-3xl font-bold mb-6">How It Works</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">
              1. Fill Out the Form Below
            </h3>
            <p className="text-muted-foreground">
              Takes 3 minutes. We need your domain, niche, DA/DR, pricing, and
              contact email. Add sample URLs if you want to showcase your best
              work.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">2. We Review (Fast)</h3>
            <p className="text-muted-foreground">
              Manual check within 24-48 hours. We verify your site loads (status
              200) and the niche matches reality. No backlink required. No shady
              requirements.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">3. Go Live Instantly</h3>
            <p className="text-muted-foreground">
              Once approved, your listing appears in search results. Marketers
              filter by DR, traffic tier, and niche. You show up when you're a
              fit.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">
              4. Get Inbound Requests
            </h3>
            <p className="text-muted-foreground">
              Logged-in users see your pricing and contact email. They reach out
              directly. You negotiate, they send content, you publish. Simple.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">5. Update Anytime</h3>
            <p className="text-muted-foreground">
              Dashboard access after approval. Change your DR, traffic tier,
              pricing, or guidelines whenever you want. No waiting for support
              tickets.
            </p>
          </div>
        </div>
      </div>

      <SubmitForm categories={categories as Category[]} />

      <SubmitFAQ />
    </div>
  );
}
