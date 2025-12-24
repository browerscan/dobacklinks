#!/usr/bin/env python3
"""
Upload screenshots to Cloudflare R2 - Improved version with progress tracking
Usage: python3 scripts/upload-r2-v2.py
"""
import os
import sys
import time
from pathlib import Path
import subprocess
import json

# Configuration
ACCOUNT_ID = "9cb8d6ec0f6094cf4f0cd6b3ee5a17a3"
API_TOKEN = "0BC1n2A2yXSOx6QaJue0gH8fL3cjrJkRq1zeGLQ3"
BUCKET_NAME = "dobacklinks"
SCREENSHOTS_DIR = "public/screenshots/thumbnails"
R2_PREFIX = "screenshots/thumbnails/"

# MIME types
MIME_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
}


def get_mime_type(filepath):
    ext = Path(filepath).suffix.lower()
    return MIME_TYPES.get(ext, "application/octet-stream")


def upload_file(file_path: Path, r2_key: str):
    """Upload a single file to R2 using curl"""
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/r2/buckets/{BUCKET_NAME}/objects/{r2_key}"
    mime_type = get_mime_type(file_path)

    cmd = [
        "curl", "-s", "-X", "PUT", url,
        "-H", f"Authorization: Bearer {API_TOKEN}",
        "-H", f"Content-Type: {mime_type}",
        "--data-binary", f"@{file_path}"
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            response = json.loads(result.stdout)
            if response.get("success"):
                return True, os.path.getsize(file_path)
        return False, result.stdout or result.stderr
    except subprocess.TimeoutExpired:
        return False, "timeout"
    except Exception as e:
        return False, str(e)


def main():
    print(f"📤 Uploading screenshots to R2")
    print(f"📁 Source: {SCREENSHOTS_DIR}")
    print(f"🪣 Bucket: {BUCKET_NAME}")
    print()

    screenshots_path = Path(SCREENSHOTS_DIR)
    if not screenshots_path.exists():
        print(f"❌ Error: Directory not found: {SCREENSHOTS_DIR}")
        sys.exit(1)

    files = sorted(list(screenshots_path.glob("**/*.webp")))
    total = len(files)

    if total == 0:
        print("❌ No files found to upload")
        sys.exit(1)

    print(f"📊 Total files: {total}")
    print(f"⏱️  Started at: {time.strftime('%H:%M:%S')}")
    print()

    success_count = 0
    failed_count = 0
    total_bytes = 0
    failed_files = []

    start_time = time.time()

    for i, file_path in enumerate(files, 1):
        rel_path = file_path.relative_to(screenshots_path)
        key = f"{R2_PREFIX}{rel_path.as_posix()}"

        success, data = upload_file(file_path, key)

        if success:
            success_count += 1
            total_bytes += data
        else:
            failed_count += 1
            failed_files.append((file_path.name, data))

        # Progress update every 50 files
        if i % 50 == 0:
            elapsed = time.time() - start_time
            rate = i / elapsed if elapsed > 0 else 0
            eta = (total - i) / rate if rate > 0 else 0
            mb = total_bytes / (1024 * 1024)
            print(f"  [{i:5d}/{total}] ✅{success_count:5d} ❌{failed_count:4d} | {mb:7.1f} MB | {rate:4.1f}/s | ETA: {eta/60:5.1f}min")

    elapsed = time.time() - start_time

    print()
    print("═" * 80)
    print("📊 Upload Summary")
    print("═" * 80)
    print(f"   Total files:     {total}")
    print(f"   ✅ Uploaded:     {success_count}")
    print(f"   ❌ Failed:       {failed_count}")
    print(f"   📦 Total size:   {total_bytes / (1024 * 1024):.1f} MB")
    print(f"   ⏱️  Duration:     {elapsed / 60:.1f} minutes")
    print(f"   🚀 Average rate: {total / elapsed:.1f} files/second")
    print()

    if failed_files:
        print(f"❌ Failed uploads ({len(failed_files)}):")
        for name, error in failed_files[:20]:
            print(f"  - {name}: {error[:100]}")
        if len(failed_files) > 20:
            print(f"  ... and {len(failed_files) - 20} more")
    else:
        print("🎉 All files uploaded successfully!")

    print()
    print(f"Access files at: https://pub-{BUCKET_NAME}.r2.dev/screenshots/thumbnails/")
    print("═" * 80)


if __name__ == "__main__":
    main()
