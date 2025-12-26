/**
 * Image Optimization Script
 *
 * Converts og.png to og.webp with 80% quality
 * Uses sharp for image processing
 *
 * Usage: node scripts/optimize-images.js
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");
const inputFile = path.join(publicDir, "og.png");
const outputFile = path.join(publicDir, "og.webp");

async function optimizeImage() {
  try {
    console.log("Starting image optimization...");

    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`Error: Input file not found: ${inputFile}`);
      process.exit(1);
    }

    // Get original file size
    const originalStats = fs.statSync(inputFile);
    const originalSizeMB = (originalStats.size / 1024 / 1024).toFixed(2);
    console.log(`Original file size: ${originalSizeMB} MB`);

    // Convert to WebP with 80% quality
    await sharp(inputFile).webp({ quality: 80 }).toFile(outputFile);

    // Get new file size
    const newStats = fs.statSync(outputFile);
    const newSizeMB = (newStats.size / 1024 / 1024).toFixed(2);
    const reduction = (((originalStats.size - newStats.size) / originalStats.size) * 100).toFixed(
      1,
    );

    console.log(`✓ Optimized file size: ${newSizeMB} MB`);
    console.log(`✓ Size reduction: ${reduction}%`);
    console.log(`✓ Output file: ${outputFile}`);
    console.log("\nOptimization complete!");
  } catch (error) {
    console.error("Error during optimization:", error);
    process.exit(1);
  }
}

optimizeImage();
