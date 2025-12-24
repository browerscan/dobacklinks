#!/usr/bin/env python3
"""
Batch upload screenshots to Cloudflare R2 using Cloudflare API
Usage: python3 scripts/upload-r2-batch.py
"""
import os
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import subprocess
import json

# Configuration
ACCOUNT_ID = "9cb8d6ec0f6094cf4f0cd6b3ee5a17a3"
API_TOKEN = "0BC1n2A2yXSOx6QaJue0gH8fL3cjrJkRq1zeGLQ3"
BUCKET_NAME = "dobacklinks"
SCREENSHOTS_DIR = "public/screenshots/thumbnails"
R2_PREFIX = "screenshots/thumbnails/"
MAX_WORKERS = 10

# MIME types
MIME_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".avif": "image/avif",
}


def get_mime_type(filepath):
    ext = Path(filepath).suffix.lower()
    return MIME_TYPES.get(ext, "application/octet-stream")


def check_object_exists(key):
    """Check if object exists in R2"""
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/r2/buckets/{BUCKET_NAME}/objects/{key}"
    result = subprocess.run(
        ["curl", "-s", "-I", "-X", "HEAD", url, "-H", f"Authorization: Bearer {API_TOKEN}"],
        capture_output=True,
        text=True
    )
    return result.returncode == 0 and "200" in result.stdout


def upload_file(file_path: Path, r2_key: str):
    """Upload a single file to R2"""
    try:
        url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/r2/buckets/{BUCKET_NAME}/objects/{r2_key}"
        mime_type = get_mime_type(file_path)

        cmd = [
            "curl", "-s", "-X", "PUT", url,
            "-H", f"Authorization: Bearer {API_TOKEN}",
            "-H", f"Content-Type: {mime_type}",
            "--data-binary", f"@{file_path}"
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        response = json.loads(result.stdout) if result.stdout else {}

        if response.get("success"):
            return True, r2_key, os.path.getsize(file_path)
        else:
            return False, r2_key, response.get("errors", ["Unknown error"])[0].get("message", "Unknown error")
    except Exception as e:
        return False, r2_key, str(e)


def main():
    print(f"📤 Uploading screenshots to R2")
    print(f"📁 Source: {SCREENSHOTS_DIR}")
    print(f"🪣 Bucket: {BUCKET_NAME}")
    print(f"🔄 Using {MAX_WORKERS} parallel workers")
    print()

    # Get all files
    screenshots_path = Path(SCREENSHOTS_DIR)
    if not screenshots_path.exists():
        print(f"❌ Error: Directory not found: {SCREENSHOTS_DIR}")
        sys.exit(1)

    files = list(screenshots_path.glob("**/*.webp"))
    total = len(files)

    if total == 0:
        print("❌ No files found to upload")
        sys.exit(1)

    print(f"📊 Total files: {total}")
    print()

    # Upload files
    success_count = 0
    failed_count = 0
    skipped_count = 0
    failed_files = []
    total_bytes = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {}
        for file_path in files:
            rel_path = file_path.relative_to(screenshots_path)
            key = f"{R2_PREFIX}{rel_path.as_posix()}"
            future = executor.submit(upload_file, file_path, key)
            futures[future] = (file_path, key)

        # Process completed uploads
        for i, future in enumerate(as_completed(futures), 1):
            file_path, key = futures[future]
            success, result_key, data = future.result()

            if success:
                success_count += 1
                total_bytes += data
            elif "already_exists" in str(data) or result_key in str(data):
                skipped_count += 1
            else:
                failed_count += 1
                failed_files.append((file_path.name, data))

            # Progress update every 50 files
            if i % 50 == 0:
                mb = total_bytes / (1024 * 1024)
                print(f"  Progress: {i}/{total} | Uploaded: {success_count} | Skipped: {skipped_count} | Size: {mb:.1f} MB")

    print()
    print("✅ Upload complete!")
    print(f"   ✅ Uploaded: {success_count}/{total}")
    print(f"   ⏭️  Skipped: {skipped_count}/{total}")
    print(f"   ❌ Failed: {failed_count}/{total}")
    print(f"   📦 Total size: {total_bytes / (1024 * 1024):.1f} MB")

    if failed_files:
        print()
        print("Failed files:")
        for name, error in failed_files[:10]:
            print(f"  - {name}: {error}")
        if len(failed_files) > 10:
            print(f"  ... and {len(failed_files) - 10} more")


if __name__ == "__main__":
    main()
