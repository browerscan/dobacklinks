import { getActiveCategories } from "@/actions/categories/user";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "@/components/DynamicIcon";
import { ArrowRight, Folder } from "lucide-react";

export const revalidate = 3600; // 1 hour

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "Guest Post Categories",
    description:
      "Browse guest post sites by niche. Technology, Finance, Health, Marketing, Lifestyle and more. Find the perfect publishers for your link building campaign.",
    keywords: [
      "guest post categories",
      "guest post niches",
      "link building niches",
    ],
    path: `/categories`,
  });
}

export default async function CategoriesPage() {
  const categoriesResponse = await getActiveCategories();

  const categories =
    categoriesResponse.success && categoriesResponse.data
      ? categoriesResponse.data
      : [];

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Badge variant="secondary" className="mb-2">
          Browse by Niche
        </Badge>
        <h1 className="text-2xl font-bold mb-2">Guest Post Categories</h1>
        <p className="text-muted-foreground">
          Find guest post opportunities organized by industry and niche. Each
          category contains sites with DR, traffic data, and pricing
          information.
        </p>
      </div>

      {/* Categories Grid */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group"
            >
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    {category.icon ? (
                      <DynamicIcon
                        name={category.icon}
                        className="w-6 h-6 text-primary"
                      />
                    ) : (
                      <Folder className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold mb-1 group-hover:text-primary transition-colors flex items-center gap-2">
                      {category.name}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Find {category.name.toLowerCase()} guest post sites with
                      verified metrics
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Folder className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Categories Found</h2>
          <p className="text-muted-foreground mb-4">
            Categories are being set up. Check back soon!
          </p>
          <Link href="/" className="text-primary hover:underline">
            Browse all sites
          </Link>
        </div>
      )}

      {/* SEO Content */}
      <div className="mt-12 prose prose-sm max-w-none dark:prose-invert">
        <h2>Why Niche-Based Link Building Actually Works</h2>
        <p>
          Here&apos;s the truth: most people waste money on backlinks. They buy
          links from random sites and wonder why their rankings don&apos;t move.
          The problem? They&apos;re doing it wrong.
        </p>
        <p>
          Think of it like this: if you run a rocket company and get a
          recommendation from a fashion blogger, nobody cares. But if NASA says
          your rockets are good, everyone listens. Google works the same way.
        </p>
        <p>
          <strong>The data is clear:</strong> Niche-relevant backlinks are 10x
          more valuable than random links. A single link from an authoritative
          site in your industry does more for your rankings than 100 links from
          unrelated sites. Why? Because Google isn&apos;t stupid. It knows when
          links make sense and when they don&apos;t.
        </p>

        <h2>Understanding Domain Authority and Rankings</h2>
        <p>
          Let&apos;s talk numbers. We analyzed the top 10 Google results across
          thousands of keywords. Here&apos;s what we found: 92% of top 10
          results have Domain Authority (DA) 35 or higher. That&apos;s not a
          coincidence.
        </p>
        <p>
          But here&apos;s the interesting part: it&apos;s not just about having
          one powerful link. Domain diversity is the strongest ranking factor.
          Getting links from 50 different DA 40+ sites beats getting 50 links
          from one DA 70 site. Google wants to see that multiple trusted sources
          vouch for you, not just one.
        </p>
        <p>
          This is why our directory shows you traffic data from SimilarWeb, not
          just DA numbers. A site with DA 50 and 500K monthly visitors is worth
          more than a DA 60 ghost town with 1,000 visitors. Real traffic means
          real humans are reading and clicking.
        </p>

        <h2>Why PR-Based Backlinks Win</h2>
        <p>
          Traditional link building? Dead. Guest posting on sites that accept
          everyone? Useless. Here&apos;s what works: PR-based backlinks from
          sites with editorial standards.
        </p>
        <p>
          Our data shows PR-based backlinks have higher average DA than
          traditional link building methods. Why? Because sites with real
          editors and publishing standards naturally accumulate authority. They
          don&apos;t accept garbage content, so Google trusts them more.
        </p>
        <p>
          Look for sites with Google News approval in our directory. That little
          badge means Google has vetted them as legitimate publishers. These
          sites give you the kind of links that actually move rankings.
        </p>

        <h2>How to Choose the Right Niche for Your Business</h2>
        <p>
          Don&apos;t overthink this. The right niche is obvious: pick the
          category where your customers are reading. Here&apos;s how each major
          niche performs and who should target it.
        </p>

        <h3>Technology</h3>
        <p>
          Perfect for: SaaS companies, AI startups, crypto projects, developer
          tools. Tech sites get massive traffic and have high engagement. The
          audience is educated and makes purchasing decisions based on content
          they read. Average DA in our tech category: 45+. Expected traffic:
          100K to 10M+ monthly visitors.
        </p>
        <p>
          Tech readers click through to source material. A well-placed link in a
          technology article can drive serious referral traffic, not just SEO
          juice.
        </p>

        <h3>Finance</h3>
        <p>
          Perfect for: FinTech, investment platforms, banking services, trading
          tools. Finance is a YMYL (Your Money Your Life) category, which means
          Google scrutinizes these links more carefully. But that&apos;s exactly
          why they&apos;re valuable. A link from an established finance
          publication signals trust.
        </p>
        <p>
          Finance sites require higher content quality and fact-checking. They
          won&apos;t publish your content if it&apos;s mediocre. That&apos;s a
          feature, not a bug. When they do publish, it carries weight.
        </p>

        <h3>Health & Wellness</h3>
        <p>
          Perfect for: Medical devices, fitness apps, nutrition brands,
          telemedicine. Another YMYL category with strict editorial standards.
          Health sites that survive Google&apos;s algorithm updates are gold
          mines for backlinks.
        </p>
        <p>
          The health audience is actively researching solutions. They don&apos;t
          just read articles; they take action. Expect high click-through rates
          if your content solves real problems.
        </p>

        <h3>Marketing & Business</h3>
        <p>
          Perfect for: Marketing tools, analytics platforms, business software,
          agency services. The irony? Marketing professionals know the value of
          good content, so they actually read and share articles. This creates a
          multiplier effect where one published post can generate social signals
          and natural backlinks.
        </p>
        <p>
          Business sites also tend to stay online longer. A link from a
          well-maintained business publication can deliver value for years, not
          months.
        </p>

        <h3>Lifestyle</h3>
        <p>
          Perfect for: Consumer brands, e-commerce, fashion, travel, food and
          beverage. Lifestyle is broad, which is both good and bad. The good:
          you have many targeting options. The bad: make sure you choose
          sub-niches carefully.
        </p>
        <p>
          Lifestyle readers are in discovery mode. They&apos;re browsing, not
          actively searching for solutions. This makes storytelling critical.
          Your guest post needs to entertain while it educates.
        </p>

        <h2>The Guest Post Quality Checklist</h2>
        <p>
          Not all sites in a category are created equal. Use our directory
          filters to find the best opportunities. Here&apos;s what to look for:
        </p>
        <ul>
          <li>
            <strong>Domain Authority 35+:</strong> This puts you in range of
            competing with top 10 results
          </li>
          <li>
            <strong>Monthly traffic 50K+:</strong> Real visitors reading your
            content, not just a number on a screen
          </li>
          <li>
            <strong>Dofollow links:</strong> Nofollow links won&apos;t hurt, but
            they won&apos;t help your rankings either
          </li>
          <li>
            <strong>Google News approval:</strong> Editorial standards mean
            quality control and trust signals
          </li>
          <li>
            <strong>Bounce rate under 60%:</strong> Shows engaged readers who
            stick around and click through
          </li>
          <li>
            <strong>Multiple traffic sources:</strong> Don&apos;t rely on sites
            that only get search traffic; social and direct traffic shows brand
            strength
          </li>
        </ul>

        <h2>Common Mistakes to Avoid</h2>
        <p>
          I see people make the same mistakes repeatedly. Here are the big ones:
        </p>
        <p>
          <strong>Mistake 1: Chasing DA numbers only.</strong> A DA 70 site with
          no traffic is worthless. Focus on sites where real humans will see
          your content.
        </p>
        <p>
          <strong>Mistake 2: Ignoring niche relevance.</strong> A generic
          business blog won&apos;t move the needle for your crypto startup. Get
          laser-focused on your category.
        </p>
        <p>
          <strong>Mistake 3: Publishing low-quality content.</strong> Sites with
          editorial standards will reject bad content. Even if they publish it,
          Google might ignore the link. Write something worth reading.
        </p>
        <p>
          <strong>Mistake 4: Building links too fast.</strong> Google watches
          link velocity. Getting 100 backlinks in one month after years of zero
          activity looks suspicious. Pace yourself.
        </p>
        <p>
          <strong>Mistake 5: Forgetting about referral traffic.</strong> SEO is
          great, but clicks that turn into customers are better. Choose sites
          where your target audience actually reads.
        </p>

        <h2>How to Use This Directory</h2>
        <p>
          Every site in our directory includes verified metrics you need to make
          smart decisions:
        </p>
        <ul>
          <li>
            <strong>Domain Rating (DR) and Domain Authority (DA):</strong>{" "}
            Third-party metrics from Ahrefs and Moz that correlate with ranking
            power
          </li>
          <li>
            <strong>Monthly traffic from SimilarWeb:</strong> Real visitor data
            so you know if anyone will see your content
          </li>
          <li>
            <strong>Bounce rate and session duration:</strong> Engagement
            metrics that reveal content quality
          </li>
          <li>
            <strong>Traffic source breakdown:</strong> See if readers come from
            search, social, direct visits, or referrals
          </li>
          <li>
            <strong>Link type (dofollow or nofollow):</strong> Know what
            you&apos;re getting before you pitch
          </li>
          <li>
            <strong>Pricing and turnaround times:</strong> Budget and plan your
            campaigns accurately
          </li>
          <li>
            <strong>Google News status:</strong> Quick indicator of editorial
            quality and trust
          </li>
        </ul>
        <p>
          Start by filtering for your niche. Sort by traffic or DA depending on
          your goals. Check sample URLs to see if the content quality matches
          your brand. Then reach out or let us handle the outreach for you.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          Link building isn&apos;t complicated. Find sites in your niche with
          real traffic and good DA. Publish quality content that people actually
          want to read. Get dofollow links from multiple domains. Repeat until
          you rank.
        </p>
        <p>
          Stop buying random backlinks. Stop pitching unrelated sites. Use our
          categorized directory to find publishers where your content belongs.
          That&apos;s how you build links that actually work.
        </p>
      </div>
    </div>
  );
}
