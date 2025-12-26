import { siteConfig } from "@/config/site";
import * as React from "react";

interface NewsletterWelcomeEmailProps {
  email: string;
  unsubscribeLink: string;
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
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#3b82f6",
    margin: "0 0 24px 0",
    textAlign: "center" as const,
  },
  paragraph: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#4b5563",
    margin: "0 0 24px 0",
  },
  list: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#4b5563",
    margin: "0 0 24px 0",
  },
  link: {
    color: "#3b82f6",
    textDecoration: "none",
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
    margin: "0",
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
};

const EnglishVersion: React.FC<{ unsubscribeLink: string }> = ({ unsubscribeLink }) => (
  <div style={commonStyles.card}>
    <div style={commonStyles.logo}>
      <img src={`${siteConfig.url}/logo.png`} alt={siteConfig.name} width={80} height={80} />
    </div>

    <h1 style={commonStyles.title}>
      <a href={siteConfig.url} style={{ textDecoration: "none", color: "#3b82f6" }}>
        {siteConfig.name}
      </a>
    </h1>
    <h2
      style={{
        ...commonStyles.title,
        fontSize: "20px",
        fontWeight: "600",
        color: "#1f2937",
      }}
    >
      You've Successfully Subscribed to {siteConfig.name} Updates!
    </h2>
    <p style={commonStyles.paragraph}>Here's what you'll receive in your inbox:</p>
    <ul style={commonStyles.list}>
      <li>{siteConfig.name} version updates</li>
      <li>Latest promotions and events from {siteConfig.name}</li>
    </ul>
    <p style={commonStyles.paragraph}>
      If you have any questions, feel free to reply to this email.
    </p>
  </div>
);

export const NewsletterWelcomeEmail: React.FC<NewsletterWelcomeEmailProps> = ({
  unsubscribeLink,
}) => {
  return (
    <div style={commonStyles.container}>
      <EnglishVersion unsubscribeLink={unsubscribeLink} />

      <div style={commonStyles.footer}>
        <p style={commonStyles.footerText}>
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
        <p style={commonStyles.unsubscribe}>
          To unsubscribe from these updates,{" "}
          <a href={unsubscribeLink} style={commonStyles.link}>
            click here
          </a>
        </p>
      </div>
    </div>
  );
};
