"use client";

import { obfuscateEmail } from "./obfuscate-email";

interface ObfuscatedEmailLinkProps {
  email: string;
  displayText?: string;
  className?: string;
}

/**
 * React component for rendering obfuscated email links
 * Uses HTML entity encoding to prevent email harvesting by bots
 */
export function ObfuscatedEmailLink({
  email,
  displayText,
  className = "text-blue-600 hover:underline font-medium",
}: ObfuscatedEmailLinkProps) {
  const obfuscatedEmail = obfuscateEmail(email);
  const obfuscatedDisplay = obfuscateEmail(displayText || email);

  // Create mailto link with obfuscated email
  const mailtoHref = `&#109;&#97;&#105;&#108;&#116;&#111;&#58;${obfuscatedEmail}`;

  return (
    <a
      href={mailtoHref}
      className={className}
      dangerouslySetInnerHTML={{ __html: obfuscatedDisplay }}
    />
  );
}
