import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
beforeAll(() => {
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  process.env.BETTER_AUTH_SECRET =
    "test-secret-key-at-least-32-characters-long";
  process.env.CRON_SECRET = "test-cron-secret-key-at-least-32-chars";
});
