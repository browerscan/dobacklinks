import { loadEnvConfig } from "@next/env";
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

export default defineConfig({
  out: "./lib/db/migrations",
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
