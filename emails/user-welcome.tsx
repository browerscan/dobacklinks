import { siteConfig } from "@/config/site";
import * as React from "react";

interface UserWelcomeEmailProps {
  name?: string;
  email: string;
  unsubscribeLink?: string;
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
    textAlign: "center" as const,
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
    fontSize: "24px",
    fontWeight: "bold",
    color: "#3b82f6",
    margin: "0 0 16px 0",
  },
  greeting: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0 0 24px 0",
  },
  paragraph: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#4b5563",
    margin: "0 0 24px 0",
  },
  socialContainer: {
    margin: "32px 0",
    textAlign: "center" as const,
  },
  socialTitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "0 0 16px 0",
  },
  socialLinks: {
    textAlign: "center" as const,
    margin: "0",
    padding: "0",
  },
  socialLink: {
    display: "inline-block",
    padding: "4px 4px",
    color: "#3b82f6",
    fontSize: "14px",
    textDecoration: "underline",
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

export const UserWelcomeEmail: React.FC<UserWelcomeEmailProps> = ({
  name,
  email,
  unsubscribeLink,
}) => {
  const displayName = name || email.split("@")[0];
  const siteName = siteConfig.name;

  return (
    <div style={commonStyles.container}>
      <div style={commonStyles.card}>
        <div style={commonStyles.logo}>
          <img src={`${siteConfig.url}/logo.png`} alt={siteName} width={80} height={80} />
        </div>

        <h1 style={commonStyles.title}>
          <a href={siteConfig.url} style={{ textDecoration: "none", color: "#3b82f6" }}>
            {siteName}
          </a>
        </h1>

        <h2 style={commonStyles.greeting}>Hi {displayName},</h2>

        <p style={commonStyles.paragraph}>
          Welcome to our newest member. You are now part of the {siteName} family! Get ready to
          depart on an exciting journey with us!
        </p>

        <div style={commonStyles.socialContainer}>
          <p style={commonStyles.socialTitle}>Connect with us:</p>
          <div style={commonStyles.socialLinks}>
            {siteConfig.socialLinks?.github && (
              <a
                href={siteConfig.socialLinks.github}
                target="_blank"
                rel="noreferrer nofollow noopener"
                style={commonStyles.socialLink}
              >
                GitHub
              </a>
            )}
            {siteConfig.socialLinks?.bluesky && (
              <a
                href={siteConfig.socialLinks.bluesky}
                target="_blank"
                rel="noreferrer nofollow noopener"
                style={commonStyles.socialLink}
              >
                Bluesky
              </a>
            )}
            {siteConfig.socialLinks?.twitter && (
              <a
                href={siteConfig.socialLinks.twitter}
                target="_blank"
                rel="noreferrer nofollow noopener"
                style={commonStyles.socialLink}
              >
                Twitter
              </a>
            )}
            {siteConfig.socialLinks?.discord && (
              <a
                href={siteConfig.socialLinks.discord}
                target="_blank"
                rel="noreferrer nofollow noopener"
                style={commonStyles.socialLink}
              >
                Discord
              </a>
            )}
            {siteConfig.socialLinks?.email && (
              <a
                href={siteConfig.socialLinks.email}
                target="_blank"
                rel="noreferrer nofollow noopener"
                style={commonStyles.socialLink}
              >
                Email
              </a>
            )}
          </div>
        </div>
      </div>

      <div style={commonStyles.footer}>
        <p style={commonStyles.footerText}>
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
        {unsubscribeLink && (
          <p style={commonStyles.unsubscribe}>
            <a href={unsubscribeLink} style={commonStyles.link}>
              Unsubscribe
            </a>{" "}
            from future emails
          </p>
        )}
      </div>
    </div>
  );
};
