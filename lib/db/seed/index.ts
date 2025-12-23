import { loadEnvConfig } from "@next/env";
import * as fs from "fs";
import * as path from "path";
import postgres from "postgres";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  console.log("Seeding database...");

  const client = postgres(connectionString);

  try {
    const categorySeedFile = path.join(__dirname, "categories_seed.sql");

    const categorySeedSql = fs.readFileSync(categorySeedFile, "utf-8");
    await client.unsafe(categorySeedSql);

    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("An error occurred while seeding the database:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
