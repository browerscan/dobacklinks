import { createDatabase } from "./config";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const db = createDatabase({
  connectionString,
});

export const isDatabaseEnabled = !!connectionString;
