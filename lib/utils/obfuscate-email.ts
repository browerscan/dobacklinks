/**
 * Email obfuscation utilities to prevent email harvesting by bots
 */

/**
 * Obfuscate email address using HTML entity encoding
 * @param email - Email address to obfuscate
 * @returns HTML string with encoded email
 */
export function obfuscateEmail(email: string): string {
  return email
    .split("")
    .map((char) => {
      // Encode each character as HTML entity
      return `&#${char.charCodeAt(0)};`;
    })
    .join("");
}

/**
 * Create an obfuscated mailto link
 * @param email - Email address
 * @param displayText - Optional display text (defaults to email)
 * @returns HTML string with obfuscated mailto link
 */
export function createObfuscatedMailtoLink(
  email: string,
  displayText?: string,
): string {
  const obfuscatedEmail = obfuscateEmail(email);
  const obfuscatedDisplay = obfuscateEmail(displayText || email);

  return `<a href="&#109;&#97;&#105;&#108;&#116;&#111;&#58;${obfuscatedEmail}" class="text-blue-600 hover:underline font-medium">${obfuscatedDisplay}</a>`;
}
