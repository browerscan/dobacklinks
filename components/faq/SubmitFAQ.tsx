type FAQItem = {
  question: string;
  answer: string;
};

const FAQItem = ({ faq }: { faq: FAQItem }) => {
  return (
    <div className="card rounded-xl p-6 shadow-sm border dark:border-gray-800">
      <div className="flex items-center mb-3">
        <h3 className="text-lg font-semibold">{faq.question}</h3>
      </div>
      <div className="text-muted-foreground">
        <p>{faq.answer}</p>
      </div>
    </div>
  );
};

export default function SubmitFAQ() {
  const faqs: FAQItem[] = [
    {
      question: "How long does the review process take?",
      answer:
        "24-48 hours. Fast and manual. We check your site loads (HTTP 200), the niche matches your domain, and you're not a PBN. That's it. No bureaucracy. No waiting weeks.",
    },
    {
      question: "What sites can I submit?",
      answer:
        "Any blog or publication that accepts guest posts. Real content, real traffic. Niche examples: Tech, Crypto, Finance, Marketing, Health, SaaS, Lifestyle. We skip PBNs, offline sites, and obvious spam networks. If you publish quality content and get organic traffic, you're in.",
    },
    {
      question: "Do I need to add a backlink to get listed?",
      answer:
        "Nope. Zero backlink requirement. We're not playing that game. We just verify your site is live and functional. You keep your editorial control. You decide who gets links and who doesn't.",
    },
    {
      question: "Can I edit my listing after approval?",
      answer:
        "Yes. Full control. Login to your dashboard and update DR, traffic tier, pricing, turnaround time, or guest post guidelines anytime. Changes go live immediately. No support tickets needed.",
    },
    {
      question: "How do I get paid when someone wants a guest post?",
      answer:
        "However you want. PayPal, USDT, bank transfer—your call. We don't process payments. Marketers contact you directly via the email you list. You negotiate, they pay you directly, you keep 100%. No middleman taking a cut.",
    },
    {
      question: "What if my DA or DR is low?",
      answer:
        "We list sites with DA 20+ or DR 15+. If you're building authority and accept guest posts, you belong here. Plenty of marketers target lower-tier sites for niche relevance or budget constraints. Don't self-reject—let the market decide.",
    },
    {
      question: "Is my contact email visible to everyone?",
      answer:
        "No. Only logged-in users see your pricing and contact email. Anonymous visitors see your DR, traffic, and niche—enough to know you exist, not enough to spam you. This filters out tire-kickers and keeps your inbox clean.",
    },
    {
      question: "Can I list multiple sites?",
      answer:
        "Absolutely. If you run 5 blogs, submit all 5. Each site gets its own listing. No limits. Just fill out the form once per site. We review each one individually.",
    },
    {
      question: "What happens if my site gets rejected?",
      answer:
        "We email you the reason. Common causes: site offline, redirect errors, niche mismatch, or PBN footprint. Fix the issue and resubmit. We're not here to gatekeep—we want quality sites in the directory. If it's legit, we'll approve it.",
    },
    {
      question: "Do you display SimilarWeb traffic data?",
      answer:
        "Yes. We pull monthly visits, bounce rate, pages per visit, and traffic sources via SimilarWeb API. This data is public on your listing—it proves your traffic is real and helps marketers justify their spend. If SimilarWeb has no data for your domain, we show what you manually enter.",
    },
    {
      question: "How do marketers find my site?",
      answer:
        "They search by niche, filter by DR/DA range, traffic tier, and price range. If you match their criteria, you show up. No algorithm games. No ad auctions. Just clean filters and fast search.",
    },
    {
      question: "What if I want to delist or pause my site?",
      answer:
        "Login to your dashboard and set your listing to 'inactive' or delete it entirely. Takes 10 seconds. You can reactivate later if you want. Full control, no lock-in.",
    },
  ];

  return (
    <section id="faq" className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-center z-10 text-lg md:text-5xl font-sans font-semibold mb-4">
            <span className="bg-clip-text bg-gradient-to-b from-foreground to-muted-foreground text-transparent">
              Frequently Asked Questions
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Everything you need to know about listing your guest post site
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} faq={faq} />
          ))}
        </div>
      </div>
    </section>
  );
}
