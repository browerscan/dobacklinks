import { siteConfig } from "@/config/site";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  TrendingUp,
  Shield,
  Zap,
  Users,
  Mail,
  CheckCircle,
  BarChart,
} from "lucide-react";

export const dynamic = "force-static";
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "About - Built by an SEO Pro Who Got Tired of Wasting Time",
    description: `${siteConfig.name} solves the link building problem: 9,700+ pre-vetted guest post sites with real traffic data. No BS, no fake metrics. Built by someone who's been doing this since 2018.`,
    path: `/about`,
  });
}

const stats = [
  { value: "9,700+", label: "Guest Post Sites" },
  { value: "50+", label: "Niches Covered" },
  { value: "DR 10-90", label: "Domain Rating Range" },
  { value: "24/7", label: "Directory Access" },
];

const features = [
  {
    icon: <Database className="w-6 h-6" />,
    title: "Comprehensive Database",
    description:
      "Access 9,700+ verified guest post sites with detailed metrics including Domain Rating, Domain Authority, traffic estimates, and spam scores.",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Real Traffic Data",
    description:
      "SimilarWeb integration provides actual monthly visits, bounce rates, and traffic source breakdowns for informed decision-making.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Quality Scoring",
    description:
      "Our proprietary algorithm scores each site based on Google News status, spam score, DR, and sample post availability.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Fast Filtering",
    description:
      "Filter by niche, DR range, link type (dofollow/nofollow), price range, and traffic tier to find your perfect targets.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-secondary/20 py-8 sm:py-12">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            No BS Link Building
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Link Building Is Broken. I Fixed It.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Here&apos;s the truth: 66.5% of backlinks die within 9 years. Most link builders waste
            weeks finding sites that won&apos;t even reply. I got tired of it. So I built the
            biggest database of verified guest post sites—9,700+ and counting. Real metrics. Real
            contacts. Zero fluff.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-background rounded-xl border p-6 shadow-sm sm:p-8 dark:border-zinc-800 space-y-8">
          {/* The Problem */}
          <section>
            <h2 className="text-2xl font-bold mb-4">The Problem: Link Building Sucks</h2>
            <p className="text-muted-foreground mb-4">
              Let&apos;s be honest. Building backlinks is like pulling teeth. You Google &quot;guest
              post sites&quot; and find outdated lists from 2019. You email 50 websites and 47 never
              reply. You pay $200 for a link that disappears when the site dies next year.
            </p>
            <p className="text-muted-foreground mb-4">
              According to Ahrefs,{" "}
              <strong>93.8% of link builders say quality is their top priority</strong>. But how do
              you judge quality when half the metrics are fake? DA can be manipulated. Traffic
              numbers lie. Contact info is buried or nonexistent.
            </p>
            <p className="text-muted-foreground mb-6">
              Meanwhile, Google&apos;s algorithm keeps getting smarter. Pages with{" "}
              <strong>100+ backlinks get 3.2x more organic traffic</strong> than those with fewer
              links. The average top-ranking page has a <strong>Domain Authority of 67</strong>. You
              need real links from real sites. Not PBNs. Not link farms. Real publishers.
            </p>
          </section>

          {/* Who Am I */}
          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">Who Am I?</h2>
            <p className="text-muted-foreground mb-4">
              I&apos;m an SEO pro who&apos;s been doing link building since 2018. Started as a
              freelance content marketer, pitched hundreds of guest posts, built links for SaaS
              companies, e-commerce brands, and local businesses. I&apos;ve seen what works and what
              doesn&apos;t.
            </p>
            <p className="text-muted-foreground mb-4">
              Here&apos;s what I learned:{" "}
              <strong>
                the hardest part isn&apos;t writing. It&apos;s finding sites worth pitching.
              </strong>{" "}
              You can write a killer article in 2 hours. But finding 20 high-DR sites in your niche?
              That takes days. Verifying their metrics? Another week. Getting contact emails? Good
              luck.
            </p>
            <p className="text-muted-foreground mb-4">
              So in 2023, I started scraping. Built a custom tool to crawl thousands of sites,
              verify their metrics via Ahrefs and Moz APIs, pull traffic data from SimilarWeb, and
              extract contact info. Took 8 months and cost me thousands in API credits. But it
              worked.
            </p>
            <p className="text-muted-foreground mb-6">
              Now I have <strong>9,700+ verified guest post sites</strong> across 50+ niches. Every
              site has real DR/DA scores, traffic estimates, pricing ranges, and direct contact
              emails. No guesswork. No dead ends. Just data.
            </p>
          </section>

          {/* The Solution */}
          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">The Solution: Real Data, Real Results</h2>
            <p className="text-muted-foreground mb-6">
              {siteConfig.name} is simple: it&apos;s the biggest curated directory of guest post
              opportunities, with metrics you can trust. Think of it as Bloomberg Terminal for link
              builders. Every site is scored on a 100-point quality algorithm based on:
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-muted-foreground mb-4">
              All data comes from industry-standard sources: Ahrefs for DR, Moz for DA, SimilarWeb
              for traffic. No made-up numbers. Sites in the top 5% globally (DA 60+) are flagged as
              premium. Sites with spam scores over 30% are filtered out.
            </p>
            <p className="text-muted-foreground">
              The result? You can find 50 high-quality targets in your niche in under 10 minutes.
              Compare pricing. Check traffic. Copy contact emails. Start outreach same day.
              That&apos;s the goal.
            </p>
          </section>

          {/* Why This Matters */}
          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">Why Quality Links Matter (The Numbers)</h2>
            <p className="text-muted-foreground mb-4">
              Backlinks aren&apos;t just about ranking anymore. They&apos;re about trust. Google
              uses links to judge expertise and authority. Here&apos;s what the data says:
            </p>
            <ul className="space-y-3 text-muted-foreground mb-6">
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>93.8% of link builders prioritize quality over quantity</strong> (Ahrefs
                  State of Link Building 2024). Volume doesn&apos;t matter if the links are trash.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Pages with 100+ backlinks get 3.2x more organic traffic</strong> than
                  pages with 10-20 links. More links = more visibility, if they&apos;re from real
                  sites.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Domain Authority 60+ sites are in the top 5% globally</strong> (Moz).
                  These are the links that move the needle. Anything below DA 30 is noise.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>66.5% of backlinks from the last 9 years are broken</strong> (Ahrefs).
                  Sites go offline. Content gets deleted. Your link disappears. That&apos;s why
                  established sites (pre-2022) score higher in our database.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>The average DA for top-ranking pages is 67</strong>. If you&apos;re
                  targeting competitive keywords, you need links from sites in that range. Anything
                  less won&apos;t compete.
                </span>
              </li>
            </ul>
            <p className="text-muted-foreground">
              Bottom line: one link from a DA 70 site is worth 100 links from DA 20 sites. Our
              directory helps you find the former, not waste time on the latter.
            </p>
          </section>

          {/* For Different Users */}
          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">Who Is This For?</h2>

            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">SEO Professionals</h3>
                  <p className="text-sm text-muted-foreground">
                    You need 50 guest post targets for a client campaign. Instead of Googling for 3
                    days, filter by niche + DR range, export the list, and start outreach same day.
                    That&apos;s 40 hours saved per campaign.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Content Marketers</h3>
                  <p className="text-sm text-muted-foreground">
                    You wrote a killer article and need authoritative publications to pitch it. Stop
                    guessing which sites accept guest posts. Search by niche, check their sample
                    articles, copy contact emails, and send personalized pitches in bulk.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Business Owners</h3>
                  <p className="text-sm text-muted-foreground">
                    You don&apos;t have time to learn SEO. You just want more customers from Google.
                    Browse sites in your industry, see pricing upfront, and hire me to handle the
                    outreach + writing. You get the link, I do the work.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Agency Teams</h3>
                  <p className="text-sm text-muted-foreground">
                    Your clients expect 20 backlinks per month. Your team wastes 60% of their time
                    prospecting. Give them access to this directory, cut research time by 80%, and
                    scale link building across 10+ clients without hiring more people.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Our Services */}
          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">Two Ways to Use This</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">DIY: Browse the Directory</h3>
                    <Badge variant="secondary">Free</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    You&apos;re a do-it-yourself type. Good. Sign up for free, browse 9,700+ sites,
                    filter by niche/DR/traffic, copy contact emails, and handle outreach yourself.
                    No subscription. No upsells. Just data.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/">Browse Directory</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Done-For-You: Hire Me</h3>
                    <Badge>Most Popular</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    You don&apos;t want to deal with outreach. I get it. Tell me your niche and
                    target DR, I&apos;ll find sites, write articles, negotiate pricing, and get you
                    published. You pay once, I handle everything. PayPal or USDT accepted.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/services">View Services</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Data Sources */}
          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">
              Where the Data Comes From (Trustworthy Sources Only)
            </h2>
            <p className="text-muted-foreground mb-4">
              I don&apos;t make up numbers. Every metric in this directory comes from
              industry-standard APIs that SEO professionals use daily. Here&apos;s what powers the
              database:
            </p>
            <ul className="grid sm:grid-cols-2 gap-3 text-sm mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>
                  <strong>Ahrefs Domain Rating (DR)</strong> - The gold standard for link authority.
                  Ranges from 0-100. Sites with DR 60+ are in the top tier.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>
                  <strong>Moz Domain Authority (DA)</strong> - Another trusted metric. Correlates
                  with Google rankings. DA 50+ means the site has serious authority.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>
                  <strong>SimilarWeb Traffic Data</strong> - Real monthly visitors, not estimates.
                  Includes bounce rate, pages per visit, and traffic sources (organic, direct,
                  social).
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>
                  <strong>Moz Spam Score</strong> - Flags sketchy sites. Anything over 30% is
                  filtered out. You won&apos;t find PBNs or link farms here.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>
                  <strong>Google News Status</strong> - Sites approved for Google News are held to
                  higher editorial standards. They&apos;re more stable and trustworthy.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>
                  <strong>Sample Guest Posts</strong> - Direct links to published examples so you
                  can see writing quality and link placement before pitching.
                </span>
              </li>
            </ul>
            <p className="text-muted-foreground">
              All metrics are refreshed regularly via automated scripts. If a site&apos;s DR drops
              or traffic tanks, you&apos;ll know. No outdated data from 2019 lists.
            </p>
          </section>

          {/* The Bigger Picture */}
          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">The Bigger Picture: Why I Built This</h2>
            <p className="text-muted-foreground mb-4">
              Link building shouldn&apos;t be this hard. You&apos;re trying to grow a business, rank
              for competitive keywords, and drive traffic. But instead of focusing on strategy,
              you&apos;re stuck Googling &quot;guest post sites in [niche]&quot; and getting garbage
              results.
            </p>
            <p className="text-muted-foreground mb-4">
              The SEO industry loves complexity. Tools cost $200/month. Agencies charge $5,000
              retainers. Courses promise &quot;insider secrets.&quot; But the reality is simple:{" "}
              <strong>
                you need high-quality backlinks from real websites, and you need them fast.
              </strong>
            </p>
            <p className="text-muted-foreground mb-6">
              That&apos;s why I built {siteConfig.name}. No monthly fees. No paywalls hiding pricing
              data. No 30-page guides explaining how to use it. Just a searchable database of 9,700+
              sites with all the metrics you need to make smart decisions. If you want to DIY,
              great. If you want me to handle it, even better. Either way, you save time and get
              results.
            </p>
          </section>

          {/* Contact */}
          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">Questions? Email Me.</h2>
            <p className="text-muted-foreground mb-6">
              I&apos;m one person running this, not a faceless corporation. If you have questions
              about the directory, need help filtering sites, or want a quote for done-for-you
              outreach, just email me. I reply fast (usually within 24 hours).
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <a href={`mailto:${siteConfig.socialLinks?.email}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  {siteConfig.socialLinks?.email}
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/services">View Services & Pricing</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Browse 9,700+ Sites</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
