import { siteConfig } from "@/config/site";
import { getSubject } from "@/lib/directory";
import { ProductSubmissionType } from "@/types/product";
import * as React from "react";

interface ProductApprovedEmailProps {
  productName: string;
  productSlug: string;
  productUrl?: string;
  logoUrl?: string;
  unsubscribeLink?: string;
  submitType: ProductSubmissionType;
}

const commonStyles = {
  container: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#f8fafc",
    padding: "40px 20px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "40px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: "32px",
  },
  logo: {
    width: "80px",
    height: "80px",
    backgroundColor: "#000000",
    borderRadius: "50%",
    margin: "0 auto 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    fontWeight: "bold",
    color: "#ffffff",
  },
  title: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#2563eb",
    margin: "0 0 16px 0",
    textAlign: "center" as const,
  },
  productCard: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "24px",
    border: "1px solid #e5e7eb",
  },
  productHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "16px",
  },
  productLogo: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    marginRight: "16px",
    backgroundColor: "#e5e7eb",
  },
  productName: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0",
  },
  productUrl: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
  successBadge: {
    backgroundColor: "#d1fae5",
    color: "#059669",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
    marginBottom: "16px",
  },
  paidBadge: {
    backgroundColor: "#fef3c7",
    color: "#d97706",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
    marginLeft: "8px",
  },
  paragraph: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#4b5563",
    margin: "0 0 16px 0",
  },
  highlight: {
    color: "#2563eb",
    fontWeight: "600",
  },
  ctaButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "16px",
    fontWeight: "600",
    display: "inline-block",
    margin: "24px 0",
  },
  benefitsList: {
    backgroundColor: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "24px",
  },
  benefitsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0369a1",
    margin: "0 0 12px 0",
  },
  benefitsItem: {
    fontSize: "14px",
    color: "#075985",
    margin: "8px 0",
    paddingLeft: "16px",
    position: "relative" as const,
  },
  checkmark: {
    position: "absolute" as const,
    left: "0",
    color: "#2563eb",
    fontWeight: "bold",
  },
  footer: {
    marginTop: "32px",
    paddingTop: "24px",
    borderTop: "1px solid #e5e7eb",
    textAlign: "center" as const,
  },
  footerText: {
    fontSize: "12px",
    color: "#9ca3af",
    margin: "0 0 8px 0",
  },
  unsubscribe: {
    fontSize: "12px",
    color: "#6b7280",
  },
  link: {
    color: "#3b82f6",
    textDecoration: "none",
  },
};

// Define submission type properties
const getSubmitTypeInfo = (type: ProductSubmissionType) => {
  switch (type) {
    case "free":
      return {
        badge: "✅ APPROVED",
        badgeColor: "#d1fae5",
        badgeTextColor: "#059669",
      };
    case "one_time":
      return {
        badge: "🚀 PREMIUM",
        badgeColor: "#fef3c7",
        badgeTextColor: "#d97706",
      };
    case "monthly_promotion":
      return {
        badge: "🚀 PROMOTED",
        badgeColor: "#e0e7ff",
        badgeTextColor: "#4338ca",
      };
    case "featured":
      return {
        badge: "🚀 FEATURED",
        badgeColor: "#fef3c7",
        badgeTextColor: "#d97706",
      };
    case "sponsor":
      return {
        badge: "👑 SPONSOR",
        badgeColor: "#f3e8ff",
        badgeTextColor: "#7c3aed",
      };
    default:
      return {
        badge: "✅ APPROVED",
        badgeColor: "#d1fae5",
        badgeTextColor: "#059669",
      };
  }
};

export const ProductApprovedEmail: React.FC<ProductApprovedEmailProps> = ({
  productName,
  productSlug,
  productUrl,
  logoUrl,
  unsubscribeLink,
  submitType,
}) => {
  const productPageUrl = `${siteConfig.url}/sites/${productSlug}`;
  const siteName = siteConfig.name;
  const discordInviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL;

  const submitInfo = getSubmitTypeInfo(submitType);

  return (
    <div style={commonStyles.container}>
      <div style={commonStyles.card}>
        <div style={commonStyles.header}>
          <div style={commonStyles.logo}>
            <img src={`${siteConfig.url}/logo.png`} alt={siteName} width={80} height={80} />
          </div>
          <h1 style={commonStyles.title}>{getSubject(submitType, productName)}</h1>
        </div>

        <div
          style={{
            ...commonStyles.successBadge,
            backgroundColor: submitInfo.badgeColor,
            color: submitInfo.badgeTextColor,
          }}
        >
          {submitInfo.badge}
        </div>

        <div style={commonStyles.productCard}>
          <div style={commonStyles.productHeader}>
            {logoUrl ? (
              <img src={logoUrl} alt={productName} style={commonStyles.productLogo} />
            ) : (
              <div style={commonStyles.productLogo} />
            )}
            <div>
              <h2 style={commonStyles.productName}>{productName}</h2>
              {productUrl && <p style={commonStyles.productUrl}>{productUrl}</p>}
            </div>
          </div>
        </div>

        <p style={commonStyles.paragraph}>
          Your product is now visible to thousands of visitors and can start attracting users,
          customers, and valuable backlinks.
        </p>

        <p style={commonStyles.paragraph}>
          Thank you for choosing {siteName} to showcase your product. We're excited to see your
          success!
        </p>

        <div style={{ textAlign: "center" }}>
          <a
            href={productPageUrl}
            style={commonStyles.ctaButton}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Your Product Page
          </a>
        </div>

        <p
          style={{
            ...commonStyles.paragraph,
            fontSize: "14px",
            fontStyle: "italic",
          }}
        >
          {discordInviteUrl ? (
            <>
              Questions or need support? Join our{" "}
              <a
                href={discordInviteUrl}
                style={{
                  ...commonStyles.link,
                  fontWeight: "600",
                  textDecoration: "underline",
                }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord community
              </a>{" "}
              for instant help and connect with other creators!
            </>
          ) : (
            "Questions or need support? Simply reply to this email and we'll help you out."
          )}
        </p>
      </div>

      <div style={commonStyles.footer}>
        <p style={commonStyles.footerText}>
          © {new Date().getFullYear()} {siteName}.
        </p>
        {unsubscribeLink && (
          <p style={commonStyles.unsubscribe}>
            <a href={unsubscribeLink} style={commonStyles.link}>
              Unsubscribe
            </a>{" "}
            from product notifications
          </p>
        )}
      </div>
    </div>
  );
};
