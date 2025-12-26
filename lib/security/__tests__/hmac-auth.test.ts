import { describe, it, expect } from "vitest";
import { generateHMACSignature, verifyHMACSignature, extractHMACSignature } from "../hmac-auth";

const TEST_SECRET = "test-secret-key-for-hmac-testing-12345";

describe("generateHMACSignature", () => {
  it("should generate consistent signature for same input", () => {
    const params = {
      method: "GET",
      path: "/api/test",
      timestamp: 1234567890000,
    };

    const signature1 = generateHMACSignature(params, TEST_SECRET);
    const signature2 = generateHMACSignature(params, TEST_SECRET);

    expect(signature1).toBe(signature2);
    expect(signature1).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex string
  });

  it("should generate different signatures for different methods", () => {
    const timestamp = Date.now();
    const sig1 = generateHMACSignature(
      { method: "GET", path: "/api/test", timestamp },
      TEST_SECRET,
    );
    const sig2 = generateHMACSignature(
      { method: "POST", path: "/api/test", timestamp },
      TEST_SECRET,
    );

    expect(sig1).not.toBe(sig2);
  });

  it("should generate different signatures for different paths", () => {
    const timestamp = Date.now();
    const sig1 = generateHMACSignature(
      { method: "GET", path: "/api/test1", timestamp },
      TEST_SECRET,
    );
    const sig2 = generateHMACSignature(
      { method: "GET", path: "/api/test2", timestamp },
      TEST_SECRET,
    );

    expect(sig1).not.toBe(sig2);
  });

  it("should generate different signatures for different timestamps", () => {
    const sig1 = generateHMACSignature(
      { method: "GET", path: "/api/test", timestamp: 1000 },
      TEST_SECRET,
    );
    const sig2 = generateHMACSignature(
      { method: "GET", path: "/api/test", timestamp: 2000 },
      TEST_SECRET,
    );

    expect(sig1).not.toBe(sig2);
  });

  it("should include body in signature if provided", () => {
    const timestamp = Date.now();
    const sig1 = generateHMACSignature(
      { method: "POST", path: "/api/test", timestamp, body: "data1" },
      TEST_SECRET,
    );
    const sig2 = generateHMACSignature(
      { method: "POST", path: "/api/test", timestamp, body: "data2" },
      TEST_SECRET,
    );

    expect(sig1).not.toBe(sig2);
  });

  it("should be case-insensitive for HTTP methods", () => {
    const timestamp = Date.now();
    const sig1 = generateHMACSignature(
      { method: "get", path: "/api/test", timestamp },
      TEST_SECRET,
    );
    const sig2 = generateHMACSignature(
      { method: "GET", path: "/api/test", timestamp },
      TEST_SECRET,
    );

    expect(sig1).toBe(sig2);
  });
});

describe("verifyHMACSignature", () => {
  it("should verify valid signature", () => {
    const params = {
      method: "GET",
      path: "/api/test",
      timestamp: Date.now(),
    };

    const signature = generateHMACSignature(params, TEST_SECRET);
    const result = verifyHMACSignature(signature, params, TEST_SECRET);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should reject invalid signature", () => {
    const params = {
      method: "GET",
      path: "/api/test",
      timestamp: Date.now(),
    };

    // Create a valid length but wrong signature (64 hex chars)
    const invalidSignature = "a".repeat(64);
    const result = verifyHMACSignature(invalidSignature, params, TEST_SECRET);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid signature");
  });

  it("should reject expired timestamp (>5 minutes old)", () => {
    const oldTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago
    const params = {
      method: "GET",
      path: "/api/test",
      timestamp: oldTimestamp,
    };

    const signature = generateHMACSignature(params, TEST_SECRET);
    const result = verifyHMACSignature(signature, params, TEST_SECRET);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Request expired");
  });

  it("should accept recent timestamp within time window", () => {
    const recentTimestamp = Date.now() - 2 * 60 * 1000; // 2 minutes ago
    const params = {
      method: "GET",
      path: "/api/test",
      timestamp: recentTimestamp,
    };

    const signature = generateHMACSignature(params, TEST_SECRET);
    const result = verifyHMACSignature(signature, params, TEST_SECRET);

    expect(result.valid).toBe(true);
  });

  it("should reject timestamp too far in future", () => {
    const futureTimestamp = Date.now() + 2 * 60 * 1000; // 2 minutes in future
    const params = {
      method: "GET",
      path: "/api/test",
      timestamp: futureTimestamp,
    };

    const signature = generateHMACSignature(params, TEST_SECRET);
    const result = verifyHMACSignature(signature, params, TEST_SECRET);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("too far in the future");
  });

  it("should respect custom maxAgeSeconds option", () => {
    const oldTimestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    const params = {
      method: "GET",
      path: "/api/test",
      timestamp: oldTimestamp,
    };

    const signature = generateHMACSignature(params, TEST_SECRET);

    // Should fail with default 5 minutes
    const result1 = verifyHMACSignature(signature, params, TEST_SECRET);
    expect(result1.valid).toBe(false);

    // Should pass with 15 minutes window
    const result2 = verifyHMACSignature(signature, params, TEST_SECRET, {
      maxAgeSeconds: 15 * 60,
    });
    expect(result2.valid).toBe(true);
  });

  it("should verify signature with body", () => {
    const params = {
      method: "POST",
      path: "/api/test",
      timestamp: Date.now(),
      body: JSON.stringify({ key: "value" }),
    };

    const signature = generateHMACSignature(params, TEST_SECRET);
    const result = verifyHMACSignature(signature, params, TEST_SECRET);

    expect(result.valid).toBe(true);
  });

  it("should fail if body is tampered", () => {
    const params = {
      method: "POST",
      path: "/api/test",
      timestamp: Date.now(),
      body: JSON.stringify({ key: "value" }),
    };

    const signature = generateHMACSignature(params, TEST_SECRET);

    // Tamper with body
    const tamperedParams = {
      ...params,
      body: JSON.stringify({ key: "hacked" }),
    };
    const result = verifyHMACSignature(signature, tamperedParams, TEST_SECRET);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid signature");
  });
});

describe("extractHMACSignature", () => {
  it("should extract signature from valid HMAC header", () => {
    const header = "HMAC abc123def456";
    const signature = extractHMACSignature(header);

    expect(signature).toBe("abc123def456");
  });

  it("should return null for missing header", () => {
    const signature = extractHMACSignature(null);
    expect(signature).toBeNull();
  });

  it("should return null for invalid format (no HMAC prefix)", () => {
    const header = "Bearer abc123";
    const signature = extractHMACSignature(header);

    expect(signature).toBeNull();
  });

  it("should return null for invalid format (missing signature)", () => {
    const header = "HMAC";
    const signature = extractHMACSignature(header);

    expect(signature).toBeNull();
  });

  it("should return null for empty header", () => {
    const signature = extractHMACSignature("");
    expect(signature).toBeNull();
  });

  it("should handle valid header correctly", () => {
    const header = "HMAC abc123def456";
    const signature = extractHMACSignature(header);

    expect(signature).toBe("abc123def456");
    expect(signature).not.toBeNull();
  });
});
