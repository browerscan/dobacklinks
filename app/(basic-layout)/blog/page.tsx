import { listPublishedPostsAction } from "@/actions/blogs/posts";
import { listTagsAction } from "@/actions/blogs/tags";
import { getPosts } from "@/lib/getBlogs";
import { constructMetadata } from "@/lib/metadata";
import { Tag } from "@/types/blog";
import { TextSearch } from "lucide-react";
import { Metadata } from "next";
import { BlogList } from "./BlogList";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "Link Building & Guest Posting Blog - Real SEO Strategies That Work",
    description:
      "No BS link building advice from SEO pros who run 9,700+ guest post sites. Learn outreach strategies, guest posting tactics, and SEO tips that actually work in 2025. Simple. Actionable. Proven.",
    path: `/blog`,
  });
}

const SERVER_POST_PAGE_SIZE = 48;

export default async function Page() {
  const { posts: localPosts } = await getPosts();

  const initialServerPostsResult = await listPublishedPostsAction({
    pageIndex: 0,
    pageSize: SERVER_POST_PAGE_SIZE,
  });

  const initialServerPosts =
    initialServerPostsResult.success && initialServerPostsResult.data?.posts
      ? initialServerPostsResult.data.posts
      : [];
  const totalServerPosts =
    initialServerPostsResult.success && initialServerPostsResult.data?.count
      ? initialServerPostsResult.data.count
      : 0;

  if (!initialServerPostsResult.success) {
    console.error(
      "Failed to fetch initial server posts:",
      initialServerPostsResult.error,
    );
  }

  const tagsResult = await listTagsAction({});
  let serverTags: Tag[] = [];
  if (tagsResult.success && tagsResult.data?.tags) {
    serverTags = tagsResult.data.tags;
  }

  const noPostsFound =
    localPosts.length === 0 && initialServerPosts.length === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
          Link Building That Actually Works
        </h1>
        <p className="text-xl text-gray-600 text-center mb-8">
          No BS. No fluff. Just real strategies that get you backlinks, traffic,
          and rankings.
        </p>
      </div>

      {/* Introduction Section */}
      <div className="max-w-4xl mx-auto mb-16 prose prose-lg">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">Why This Blog Exists</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Most SEO blogs are garbage. They repeat the same tired advice from
            2015. They tell you to "create great content" without explaining
            how. They make link building sound like rocket science when it's
            actually simple.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We're different. We run a guest post directory with{" "}
            <strong>9,700+ vetted sites</strong>. We do outreach daily. We know
            what works because we're in the trenches. This blog shares what we
            learn—explained so simply that a 5th grader could execute it
            tomorrow.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg border-2 border-blue-100 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">3.5x</div>
            <div className="text-sm text-gray-600">
              More backlinks for content over 3,000 words
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border-2 border-indigo-100 text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">43%</div>
            <div className="text-sm text-gray-600">
              Of link builders now use AI for content creation
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border-2 border-purple-100 text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">68%</div>
            <div className="text-sm text-gray-600">
              Of backlinks come from content marketing
            </div>
          </div>
        </div>

        {/* Topics We Cover */}
        <h2 className="text-2xl font-bold mb-6">What You'll Learn Here</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <span className="text-blue-600 mr-2">→</span>
              Link Building Strategies
            </h3>
            <p className="text-gray-600 mb-4">
              How to get backlinks without begging, buying sketchy links, or
              wasting months on "relationship building." Real tactics that work
              in 2025, not 2015.
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  Finding high-DR sites that actually accept guest posts
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Writing pitches that get 40%+ response rates</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Scaling outreach without hiring a team</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <span className="text-indigo-600 mr-2">→</span>
              Guest Posting Mastery
            </h3>
            <p className="text-gray-600 mb-4">
              Guest posting isn't dead—you're just doing it wrong. Learn how to
              write posts that editors love, readers share, and Google rewards.
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Choosing topics that get accepted 90% of the time</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  Writing content that passes editorial review instantly
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Avoiding common mistakes that get you blacklisted</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <span className="text-purple-600 mr-2">→</span>
              SEO That Makes Sense
            </h3>
            <p className="text-gray-600 mb-4">
              SEO is simple. You need links. You need content. You need to not
              screw up technical stuff. We explain it like you're five.
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  Understanding what actually moves the needle in 2025
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Ignoring vanity metrics that waste your time</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  Tracking what matters: rankings, traffic, conversions
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <span className="text-red-600 mr-2">→</span>
              Outreach Automation
            </h3>
            <p className="text-gray-600 mb-4">
              Time is money. Learn to automate outreach so you can send 100
              pitches in the time it used to take to send 10—without sounding
              like a robot.
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Tools that actually work vs. expensive garbage</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Personalizing at scale without spending hours</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Following up without being annoying</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Why Read This Blog */}
        <div className="bg-gray-900 text-white p-8 rounded-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Why You Should Read This Blog
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Because we're not just talking theory. We operate{" "}
            <strong>DoBacklinks.com</strong>, a directory of 9,700+ guest post
            opportunities. We know which sites actually publish your content. We
            know which pitches get ignored. We know what works.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Here's what makes us different:
          </p>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <span className="text-yellow-400 mr-3 font-bold">1.</span>
              <span>
                <strong>Real Experience:</strong> We do outreach daily. We've
                pitched thousands of sites. We've seen what works and what's a
                waste of time.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-3 font-bold">2.</span>
              <span>
                <strong>No BS Filter:</strong> We won't tell you to "create
                amazing content" and call it a day. We give you exact steps,
                templates, and examples.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-3 font-bold">3.</span>
              <span>
                <strong>Updated for 2025:</strong> Link building changes fast.
                We update our strategies based on what's working right now, not
                what worked five years ago.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-3 font-bold">4.</span>
              <span>
                <strong>Simple Language:</strong> If a 5th grader can't
                understand it, we rewrite it. No jargon. No fluff. Just clear
                instructions.
              </span>
            </li>
          </ul>
        </div>

        {/* Who This Blog Is For */}
        <h2 className="text-2xl font-bold mb-4">Who Should Read This</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-lg mb-2">Perfect For:</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• SEO professionals building links for clients</li>
              <li>• Content marketers who need more backlinks</li>
              <li>• Startup founders doing their own SEO</li>
              <li>• Agencies looking to scale outreach</li>
              <li>• Anyone tired of crappy SEO advice</li>
            </ul>
          </div>
          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="font-semibold text-lg mb-2">Not For:</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• People who want magic overnight results</li>
              <li>• Those looking for black-hat shortcuts</li>
              <li>• Readers who prefer 10-page theoretical essays</li>
              <li>• Anyone who thinks SEO is dead (it's not)</li>
              <li>• People who won't take action</li>
            </ul>
          </div>
        </div>

        {/* How to Use This Blog */}
        <h2 className="text-2xl font-bold mb-4">
          How to Get the Most Out of This Blog
        </h2>
        <ol className="space-y-3 text-gray-700 mb-8">
          <li className="flex items-start">
            <span className="font-bold text-blue-600 mr-3">Step 1:</span>
            <span>
              Start with our beginner guides if you're new to link building.
              We'll get you up to speed fast.
            </span>
          </li>
          <li className="flex items-start">
            <span className="font-bold text-blue-600 mr-3">Step 2:</span>
            <span>
              Use the search and category filters to find topics relevant to
              your situation. Don't read random posts—be strategic.
            </span>
          </li>
          <li className="flex items-start">
            <span className="font-bold text-blue-600 mr-3">Step 3:</span>
            <span>
              Actually implement what you learn. Reading without action is
              worthless. Try one tactic from each post.
            </span>
          </li>
          <li className="flex items-start">
            <span className="font-bold text-blue-600 mr-3">Step 4:</span>
            <span>
              Subscribe to get new posts. We publish weekly, and each post is
              designed to save you hours of trial and error.
            </span>
          </li>
          <li className="flex items-start">
            <span className="font-bold text-blue-600 mr-3">Step 5:</span>
            <span>
              If you need help with outreach or guest posting, check out our
              services. We can do the heavy lifting for you.
            </span>
          </li>
        </ol>
      </div>

      {/* Blog List */}
      {noPostsFound ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <TextSearch className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Blog Posts Yet</h2>
          <p className="text-gray-500 max-w-md">
            We are creating exciting content, please stay tuned!
          </p>
        </div>
      ) : (
        <BlogList
          localPosts={localPosts}
          initialPosts={initialServerPosts}
          initialTotal={totalServerPosts}
          serverTags={serverTags}
          pageSize={SERVER_POST_PAGE_SIZE}
        />
      )}

      {/* Bottom SEO Section */}
      <div className="max-w-4xl mx-auto mt-16 prose prose-lg">
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-8 rounded-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">
            The Truth About Link Building in 2025
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Let's be honest: most link building advice is outdated. People still
            recommend tactics from 2015 that stopped working years ago. They
            tell you to "build relationships" without explaining how. They
            suggest "creating linkable assets" as if you have unlimited time and
            budget.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            The reality? Link building today is about efficiency. You need a
            system. You need templates. You need a list of sites that actually
            accept guest posts. That's why we built DoBacklinks—to give you the
            infrastructure to scale outreach without wasting months on dead
            ends.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">
            What Actually Works in 2025
          </h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            After analyzing thousands of successful link building campaigns,
            we've identified what consistently works:
          </p>
          <ul className="space-y-2 text-gray-700 mb-6">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">→</span>
              <span>
                <strong>Targeted outreach to pre-qualified sites:</strong> Don't
                waste time pitching sites that never publish guest posts. Use
                directories like ours to find sites that are proven to accept
                content.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">→</span>
              <span>
                <strong>Personalized pitches at scale:</strong> Templates are
                fine, but you need to customize the first sentence. That's the
                difference between 5% and 40% response rates.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">→</span>
              <span>
                <strong>Content that editors can't refuse:</strong> Write posts
                that solve real problems. Make them better than what's currently
                on the site. Editors say yes when you make their job easier.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">→</span>
              <span>
                <strong>Persistent follow-up:</strong> Most people give up after
                one email. Following up 2-3 times (politely) doubles your
                success rate.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">→</span>
              <span>
                <strong>Data-driven decisions:</strong> Track what works. If
                your pitch gets ignored 95% of the time, change it. If certain
                niches never respond, move on.
              </span>
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            Common Mistakes That Kill Your Results
          </h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            We see people make the same mistakes over and over. Here's what to
            avoid:
          </p>
          <ul className="space-y-2 text-gray-700 mb-6">
            <li className="flex items-start">
              <span className="text-red-600 mr-2">✗</span>
              <span>
                <strong>Generic pitches:</strong> "Hi, I'd like to contribute to
                your blog" gets deleted instantly. Reference specific articles.
                Show you read their site.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">✗</span>
              <span>
                <strong>Low-quality content:</strong> Don't submit garbage. If
                your content is worse than what's already on the site, you'll
                get rejected and blacklisted.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">✗</span>
              <span>
                <strong>Ignoring guidelines:</strong> If a site says "no links
                in author bio," don't ask for a link in your author bio. Read
                their requirements.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">✗</span>
              <span>
                <strong>Giving up too fast:</strong> Outreach is a numbers game.
                100 pitches might get you 10 responses and 3 placements. That's
                normal. Keep going.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">✗</span>
              <span>
                <strong>Focusing on vanity metrics:</strong> Domain Authority
                isn't everything. A DR 30 site with real traffic beats a DR 70
                PBN every time.
              </span>
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            How DoBacklinks Makes This Easier
          </h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            We built DoBacklinks because we were tired of wasting time on bad
            prospects. Our directory gives you:
          </p>
          <ul className="space-y-2 text-gray-700 mb-6">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>
                <strong>9,700+ vetted guest post sites</strong> with verified
                contact info, pricing, and turnaround times
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>
                <strong>Real traffic data</strong> from SimilarWeb so you know
                which sites actually get visitors
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>
                <strong>Quality scores</strong> based on DR, spam score, Google
                News approval, and other metrics
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>
                <strong>Niche filtering</strong> so you can find sites in your
                industry in seconds
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>
                <strong>Personal outreach services</strong> if you want us to
                handle the entire process for you
              </span>
            </li>
          </ul>

          <div className="bg-white p-6 rounded-lg border-2 border-blue-200 mt-8">
            <h3 className="text-xl font-semibold mb-3">
              Ready to Build Links That Move the Needle?
            </h3>
            <p className="text-gray-700 mb-4">
              Browse our blog for actionable strategies, or skip the learning
              curve and let us handle outreach for you. We've already done the
              hard work of finding sites that publish guest posts. Now it's just
              execution.
            </p>
            <p className="text-gray-700">
              Questions? Email us at{" "}
              <a
                href="mailto:outreach@dobacklinks.com"
                className="text-blue-600 hover:underline font-semibold"
              >
                outreach@dobacklinks.com
              </a>
              . We respond within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
