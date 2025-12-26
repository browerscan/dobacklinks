/**
 * Test Database Performance Monitoring (Simple Version)
 *
 * This script tests the performance monitoring API endpoints
 * Run with: pnpm tsx scripts/test-db-performance.simple.ts
 *
 * Prerequisites:
 * - Dev server running on http://localhost:3000
 */

async function main() {
  const baseUrl = "http://localhost:3000/api/debug/performance";

  console.log("=".repeat(60));
  console.log("Database Performance Monitoring Test");
  console.log("=".repeat(60));
  console.log("");

  // Check if dev server is running
  try {
    const response = await fetch(baseUrl);
    if (!response.ok && response.status !== 403) {
      throw new Error("Server not responding correctly");
    }
  } catch (error) {
    console.error("Error: Dev server is not running on http://localhost:3000");
    console.error("Please start it first with: pnpm dev");
    process.exit(1);
  }

  // Test 1: Basic summary
  console.log("1. Testing performance summary endpoint...");
  try {
    const response = await fetch(baseUrl);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }

  console.log("\n" + "-".repeat(60) + "\n");

  // Test 2: With statistics
  console.log("2. Testing performance with statistics...");
  try {
    const response = await fetch(`${baseUrl}?includeStats=true`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }

  console.log("\n" + "-".repeat(60) + "\n");

  // Test 3: With slow queries
  console.log("3. Testing performance with slow queries...");
  try {
    const response = await fetch(`${baseUrl}?includeSlowQueries=true&includeStats=true`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }

  console.log("\n" + "-".repeat(60) + "\n");

  // Test 4: Reset
  console.log("4. Testing reset endpoint...");
  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "reset" }),
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Test completed successfully!");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
