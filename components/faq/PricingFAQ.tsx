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

export default function PricingFAQ() {
  const faqs: FAQItem[] = [
    {
      question: "What's included with each pricing plan?",
      answer:
        "Free: Basic directory listing (48h review). One-Time Pro: Lifetime listing + immediate review + priority support. Monthly Promotion: All Pro features + auto-refresh to top monthly. Featured Listing: Premium spotlight placement + always above basic listings + enhanced visibility across the platform.",
    },
    {
      question: "How does being featured help my business grow?",
      answer:
        "Our platform connects your tool with users actively searching for solutions like yours. Featured listings get more visibility, leading to increased user discovery, organic growth, and better brand recognition within your target market. Many creators see significant user acquisition from their listings.",
    },
    {
      question: "Can I upgrade or downgrade my plan later?",
      answer:
        "Yes! You can upgrade to a higher plan anytime to unlock additional features and enhanced visibility. For downgrades, changes will take effect at your next billing cycle. Contact our support team for assistance with plan changes.",
    },
    {
      question: "Do you offer refunds if I'm not satisfied?",
      answer:
        "We offer a 14-day money-back guarantee for all paid plans. If you're not satisfied with our service within the first 14 days, contact our support team for a full refund. Please note that processing and review work completed cannot be reversed.",
    },
    {
      question: "Why is Monthly Promotion marked as 'Most Popular'?",
      answer:
        "Monthly Promotion offers the best value for most creators - it starts at just $1 for the first month and includes auto-refresh to top monthly, keeping your tool visible to new visitors. It's perfect for tools that need consistent visibility without the higher cost of Featured Listing, making it our most chosen option.",
    },
    {
      question: "How long do the benefits last after payment?",
      answer:
        "One-Time Pro provides lifetime listing that remains active permanently. Monthly Promotion includes auto-refresh to top for the subscription duration, with basic listing continuing after cancellation. Featured Listing provides premium spotlight placement during the subscription period, then reverts to basic listing. All listings remain discoverable indefinitely once published.",
    },
  ];

  return (
    <section id="pricing-faq" className="py-20 bg-muted/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-center z-10 text-lg md:text-5xl font-sans font-semibold mb-4">
            <span className="bg-clip-text bg-gradient-to-b from-foreground to-muted-foreground text-transparent">
              Pricing Questions & Answers
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Common questions about our pricing plans and what you get
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
