/**
 * Generate Better Auth compatible password hash
 * Usage: pnpm tsx scripts/hash-password.ts
 */

import { hashPassword } from "better-auth/crypto";

async function generateHash() {
  const password = "Admin@2024!";
  const hash = await hashPassword(password);
  console.log("Password:", password);
  console.log("Hash:", hash);
  console.log("\nUse this hash in the SQL script:");
  console.log(`'${hash}'`);
}

generateHash().catch(console.error);
