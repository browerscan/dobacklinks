import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for React component tests
    environment: "jsdom",

    // Setup files
    setupFiles: ["./vitest.setup.ts"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        ".next/",
        "**/*.config.{js,ts,mjs}",
        "**/*.d.ts",
        "**/types/",
        "emails/",
        "sentry.*.config.ts",
        "instrumentation.ts",
      ],
    },

    // Global test settings
    globals: true,
    includeSource: ["lib/**/*.{js,ts}"],

    // Test match patterns
    include: ["**/__tests__/**/*.test.{ts,tsx}", "**/*.test.{ts,tsx}"],

    // Exclude patterns
    exclude: ["node_modules", "dist", ".next", "cypress", "playwright", "**/*.spec.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
