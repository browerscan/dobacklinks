/**
 * Create Admin User Script
 * Usage: pnpm tsx scripts/create-admin-user.ts
 */

// Load environment variables
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "@/lib/db";
import { user, account } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { hashPassword } from "better-auth/crypto";

// Admin user details
const ADMIN_EMAIL = "outreach@dobacklinks.com";
const ADMIN_PASSWORD = "Admin@2024!";
const ADMIN_NAME = "Admin";

async function createAdminUser() {
  try {
    console.log("Creating admin user...");

    // Check if user already exists
    const existingUser = await db.select().from(user).where(eq(user.email, ADMIN_EMAIL)).limit(1);

    if (existingUser.length > 0) {
      console.log("❌ User already exists with email:", ADMIN_EMAIL);
      console.log("User ID:", existingUser[0].id);
      console.log("Current role:", existingUser[0].role);

      // Update to admin if not already
      if (existingUser[0].role !== "admin") {
        await db.update(user).set({ role: "admin" }).where(eq(user.id, existingUser[0].id));
        console.log("✅ Updated user role to admin");
      }

      return;
    }

    // Create user
    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);

    // Insert user
    await db.insert(user).values({
      id: userId,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: "admin",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ User created:", userId);

    // Create account for email/password login
    await db.insert(account).values({
      id: crypto.randomUUID(),
      userId: userId,
      accountId: ADMIN_EMAIL, // For credential provider
      providerId: "credential", // Better Auth credential provider
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Account created with password authentication");

    // Verify creation
    const createdUser = await db.select().from(user).where(eq(user.email, ADMIN_EMAIL)).limit(1);

    console.log("\n📋 Admin User Details:");
    console.log("  ID:", createdUser[0].id);
    console.log("  Email:", createdUser[0].email);
    console.log("  Name:", createdUser[0].name);
    console.log("  Role:", createdUser[0].role);
    console.log("  Email Verified:", createdUser[0].emailVerified);
    console.log("\n🔑 Login Credentials:");
    console.log("  Email:", ADMIN_EMAIL);
    console.log("  Password:", ADMIN_PASSWORD);
    console.log("\n✅ Admin user created successfully!");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

createAdminUser();
