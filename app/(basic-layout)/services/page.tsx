import { Metadata } from "next";
import { constructMetadata } from "@/lib/metadata";
import { generateFAQSchema } from "@/lib/structured-data";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Send,
  Database,
  Zap,
  CheckCircle,
  TrendingUp,
  Target,
  Clock,
  Shield,
} from "lucide-react";
import Script from "next/script";

export const dynamicParams = true;

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "Services",
    description: `Guest post outreach, writing, and data export by ${siteConfig.name}. PayPal friendly.`,
    path: `/services`,
  });
}

const services = [
  {
    title: "Self-Serve Directory",
    price: "Free",
    description:
      "Browse 9,700+ sites with DR, traffic data, and pricing. Use advanced filters and reach out directly to publishers.",
    cta: {
      label: "Browse Sites",
      href: "/",
    },
    badge: "DIY",
    icon: <Zap className="w-4 h-4" />,
    features: [
      "Full access to all site metrics",
      "Filter by niche, DR, traffic tier",
      "Direct publisher contact info",
    ],
  },
  {
    title: "Guest Posting Service",
    price: "From $50/post",
    description:
      "I handle everything: prospecting, outreach, content writing, and publication on quality sites. Pay via PayPal/USDT.",
    cta: {
      label: "Hire Me",
      href: "mailto:outreach@dobacklinks.com?subject=Hire%20you%20for%20guest%20posting",
    },
    badge: "Done-for-you",
    icon: <Send className="w-4 h-4" />,
    features: [
      "Full-service link building",
      "Content creation included",
      "Fast turnaround (3-7 days)",
    ],
  },
  {
    title: "Custom Data Export",
    price: "From $25/list",
    description:
      "Need a CSV of 200+ niche sites with DR/traffic/pricing? I'll pull, clean, and deliver ready-to-use data.",
    cta: {
      label: "Request List",
      href: "mailto:outreach@dobacklinks.com?subject=Custom%20guest%20post%20list",
    },
    badge: "Data",
    icon: <Database className="w-4 h-4" />,
    features: ["Custom niche filtering", "Clean CSV format", "DR, DA, traffic, contact info"],
  },
];

// FAQ Schema for SEO - using centralized generator
const faqs = [
  {
    question: "What niches do you cover?",
    answer:
      "Technology, finance, health, marketing, business, and lifestyle. My database has 9,700+ sites across these categories. If you need something niche (like crypto or SaaS), I can filter for it. Check the directory at the homepage to browse by niche.",
  },
  {
    question: "Do you write the content?",
    answer:
      "Yes. Guest posting service includes writing. I research your topic, write 800-1500 words (depending on site requirements), and insert your links naturally. If you already have content, I can edit it to match the publisher's style.",
  },
  {
    question: "How long does it take to get a guest post published?",
    answer:
      "Most guest posts go live in 3-7 days. Some high-authority sites take 2 weeks. I'll tell you upfront so you know what to expect.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "If a publisher fails to publish after I've paid them, you get a full refund or I re-pitch to another site at no extra cost. If the post goes live but gets removed later (rare), I'll replace it for free within 30 days.",
  },
  {
    question: "Are these dofollow or nofollow links?",
    answer:
      "Most are dofollow. The directory shows link type for each site. I prioritize dofollow placements because that's what moves rankings. If a site only offers nofollow, I'll tell you before pitching.",
  },
  {
    question: "How do I know these sites are legit?",
    answer:
      "Every site shows DR (Domain Rating), DA (Domain Authority), monthly traffic, spam score, and whether they're Google News approved. I verify metrics using Ahrefs, Moz, and SimilarWeb. If a site's metrics drop or they get penalized, I remove them from the directory.",
  },
];

const faqSchema = generateFAQSchema(faqs);

export default function ServicesPage() {
  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <Badge className="px-3 py-1" variant="secondary">
            Guest Post Services
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Hire one person to ship your guest posts
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            No subscriptions—just PayPal/USDT and fast communication. Pick a path below and
            let&apos;s move.
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.title} className="h-full flex flex-col">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {service.icon}
                    {service.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
                <p className="text-lg font-semibold text-primary">{service.price}</p>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground">{service.description}</p>
                {service.features && (
                  <ul className="space-y-2 text-sm flex-1">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button asChild className="w-full mt-auto">
                  <Link href={service.cta.href}>{service.cta.label}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Why Work With Me Section */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">Why work with me?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple. Most link building is broken. Here&apos;s why I&apos;m different.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">No fluff, just results</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  I don&apos;t sell you complex dashboards or mystery metrics. You get backlinks on
                  real sites with real traffic. That&apos;s it. The average paid link costs $83—I
                  keep pricing transparent and fair.
                </p>
                <p className="text-sm text-muted-foreground">
                  Cold outreach has an 8.5% success rate. I built a database of 9,700+ verified
                  publishers who actually respond. You skip the rejection emails.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Speed matters</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Most agencies take weeks. I ship guest posts in 3-7 days. No project managers. No
                  quarterly business reviews. Just fast execution.
                </p>
                <p className="text-sm text-muted-foreground">
                  Think of it like manufacturing. Tesla doesn&apos;t make cars slower by adding more
                  meetings. Same principle here—less bureaucracy, faster delivery.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Quality you can verify</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Every site in my database shows Domain Rating (DR), Domain Authority (DA), monthly
                  traffic, and spam score. You pick what you want. No black-box recommendations.
                </p>
                <p className="text-sm text-muted-foreground">
                  I prioritize Google News-approved sites and domains with DR 70+. If a site looks
                  sketchy, I won&apos;t pitch it to you—even if they pay me to list them.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Built for scale</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Whether you need 5 links or 50, the process stays simple. 46% of marketers spend
                  $10,000+ annually on link building. I help you get more value per dollar by
                  cutting out agency markup.
                </p>
                <p className="text-sm text-muted-foreground">
                  81% of marketers believe link building costs will keep rising. I&apos;m keeping
                  mine flat by staying lean—one person, minimal overhead, maximum output.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* My Process Section */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">How it works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three steps. No complexity. No surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold">Tell me what you need</h3>
              <p className="text-sm text-muted-foreground">
                Email me at outreach@dobacklinks.com with your target URLs, anchor text, and niche.
                Want 5 links in health? Done. Need 50 in fintech? Let&apos;s go.
              </p>
              <p className="text-sm text-muted-foreground">
                You can browse my directory first and pick specific sites, or tell me your criteria
                (DR 50+, 100K+ monthly traffic) and I&apos;ll recommend options.
              </p>
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold">I handle everything</h3>
              <p className="text-sm text-muted-foreground">
                I pitch publishers, negotiate pricing, write content (or edit yours), and get your
                links live. You get updates via email—no login portals, no status dashboards.
              </p>
              <p className="text-sm text-muted-foreground">
                Most guest posts go live in 3-7 days. Some high-authority sites take 2 weeks.
                I&apos;ll tell you upfront so you know what to expect.
              </p>
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold">You pay when it&apos;s done</h3>
              <p className="text-sm text-muted-foreground">
                Once your guest post is published, I send you the live URL and a PayPal or USDT
                invoice. No upfront retainers. No monthly subscriptions. Pay for what you get.
              </p>
              <p className="text-sm text-muted-foreground">
                Bulk orders? I can do milestone payments (50% upfront, 50% on delivery). We keep it
                flexible and fair.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="rounded-xl border p-8 bg-muted/30">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold">The link building landscape</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Industry data shows why you need a better approach
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <div className="text-3xl sm:text-4xl font-bold text-primary">46%</div>
              <p className="text-sm text-muted-foreground">
                of marketers spend $10,000+ annually on link building
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl sm:text-4xl font-bold text-primary">8.5%</div>
              <p className="text-sm text-muted-foreground">
                success rate for cold outreach campaigns (industry average)
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl sm:text-4xl font-bold text-primary">81%</div>
              <p className="text-sm text-muted-foreground">
                believe link building costs will continue rising
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl sm:text-4xl font-bold text-primary">$83</div>
              <p className="text-sm text-muted-foreground">
                average cost per paid backlink (before agency markup)
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">Common questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Quick answers. No sales speak.
            </p>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What niches do you cover?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Technology, finance, health, marketing, business, and lifestyle. My database has
                  9,700+ sites across these categories. If you need something niche (like crypto or
                  SaaS), I can filter for it. Check the directory at the homepage to browse by
                  niche.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you write the content?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Yes. Guest posting service includes writing. I research your topic, write 800-1500
                  words (depending on site requirements), and insert your links naturally. If you
                  already have content, I can edit it to match the publisher&apos;s style.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Are these dofollow or nofollow links?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Most are dofollow. The directory shows link type for each site. I prioritize
                  dofollow placements because that&apos;s what moves rankings. If a site only offers
                  nofollow, I&apos;ll tell you before pitching.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do I know these sites are legit?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Every site shows DR (Domain Rating), DA (Domain Authority), monthly traffic, spam
                  score, and whether they&apos;re Google News approved. I verify metrics using
                  Ahrefs, Moz, and SimilarWeb. If a site&apos;s metrics drop or they get penalized,
                  I remove them from the directory.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  What if I only want the data, not the service?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Use the self-serve directory (free) to browse sites and reach out yourself. Or pay
                  for a custom CSV export with 200+ filtered sites in your niche—cleaned data with
                  contact info, pricing, and metrics. Starts at $25.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  If a publisher fails to publish after I&apos;ve paid them, you get a full refund
                  or I re-pitch to another site at no extra cost. If the post goes live but gets
                  removed later (rare), I&apos;ll replace it for free within 30 days.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do I pay?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  PayPal or USDT. I send an invoice after your guest post is live. For bulk orders
                  (10+ posts), we can do 50% upfront and 50% on delivery. No credit cards, no
                  Stripe, no subscriptions—just straightforward invoices.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <div className="rounded-xl border p-6 bg-muted/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Need something else?</h3>
            <p className="text-sm text-muted-foreground">
              Partnerships, bulk publishing, or anchor text clean-up—send me a note.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link href="mailto:outreach@dobacklinks.com?subject=Custom%20request">
              <Mail className="w-4 h-4" />
              Email outreach@dobacklinks.com
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
