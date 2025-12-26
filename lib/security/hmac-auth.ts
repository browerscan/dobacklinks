import crypto from "crypto";

/**
 * HMAC-based API authentication
 * Provides cryptographic signature verification with replay attack protection
 */

interface HMACSignatureParams {
  method: string;
  path: string;
  timestamp: number;
  body?: string;
}

/**
 * Generate HMAC signature for API request
 * @param params - Request parameters (method, path, timestamp, body)
 * @param secret - Secret key for signing
 * @returns HMAC signature (hex string)
 */
export function generateHMACSignature(params: HMACSignatureParams, secret: string): string {
  const { method, path, timestamp, body = "" } = params;

  // Create canonical string: METHOD|PATH|TIMESTAMP|BODY
  const canonicalString = [method.toUpperCase(), path, timestamp.toString(), body].join("|");

  // Generate HMAC-SHA256 signature
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(canonicalString);

  return hmac.digest("hex");
}

interface VerifyHMACOptions {
  maxAgeSeconds?: number; // Maximum allowed age of request (default: 300s = 5 minutes)
}

/**
 * Verify HMAC signature for API request
 * @param signature - Signature to verify
 * @param params - Request parameters
 * @param secret - Secret key for verification
 * @param options - Verification options (maxAgeSeconds for replay protection)
 * @returns True if signature is valid and not expired
 */
export function verifyHMACSignature(
  signature: string,
  params: HMACSignatureParams,
  secret: string,
  options: VerifyHMACOptions = {},
): { valid: boolean; error?: string } {
  const { maxAgeSeconds = 300 } = options; // Default: 5 minutes

  // 1. Verify timestamp (replay attack protection)
  const now = Date.now();
  const requestAge = (now - params.timestamp) / 1000; // Convert to seconds

  if (requestAge > maxAgeSeconds) {
    return {
      valid: false,
      error: `Request expired. Age: ${requestAge.toFixed(0)}s, Max: ${maxAgeSeconds}s`,
    };
  }

  if (requestAge < -60) {
    // Allow 1 minute clock skew
    return {
      valid: false,
      error: "Request timestamp is too far in the future",
    };
  }

  // 2. Generate expected signature
  const expectedSignature = generateHMACSignature(params, secret);

  // 3. Compare signatures using constant-time comparison to prevent timing attacks
  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!valid) {
    return {
      valid: false,
      error: "Invalid signature",
    };
  }

  return { valid: true };
}

/**
 * Extract HMAC signature from Authorization header
 * Expected format: "HMAC <signature>"
 * @param authHeader - Authorization header value
 * @returns Signature string or null if invalid format
 */
export function extractHMACSignature(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "HMAC") {
    return null;
  }

  return parts[1];
}
