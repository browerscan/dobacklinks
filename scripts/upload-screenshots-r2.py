#!/usr/bin/env python3
"""
Batch upload screenshots to Cloudflare R2
Usage: python scripts/upload-screenshots-r2.py
"""
import os
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import boto3
from botocore.exceptions import ClientError

# Configuration
BUCKET_NAME = "dobacklinks"
SCREENSHOTS_DIR = "public/screenshots/thumbnails"
R2_PREFIX = "screenshots/thumbnails/"
MAX_WORKERS = 20  # Parallel uploads

# R2 credentials from environment
ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")

if not all([ACCESS_KEY_ID, SECRET_ACCESS_KEY, ACCOUNT_ID]):
    print("❌ Error: R2 credentials not set!")
    print("   Please set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ACCOUNT_ID")
    sys.exit(1)

# R2 S3 client endpoint
ENDPOINT_URL = f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com"


def upload_file(s3_client, file_path: Path, bucket: str, key: str):
    """Upload a single file to R2"""
    try:
        s3_client.upload_file(
            str(file_path),
            bucket,
            key,
            ExtraArgs={'ContentType': 'image/webp'}
        )
        return True, key
    except Exception as e:
        return False, f"{key}: {str(e)}"


def main():
    print(f"📤 Uploading screenshots to R2")
    print(f"📁 Source: {SCREENSHOTS_DIR}")
    print(f"🪣 Bucket: {BUCKET_NAME}")
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
    print(f"🔄 Using {MAX_WORKERS} parallel workers")
    print()

    # Initialize S3 client
    s3_client = boto3.client(
        's3',
        endpoint_url=ENDPOINT_URL,
        aws_access_key_id=ACCESS_KEY_ID,
        aws_secret_access_key=SECRET_ACCESS_KEY,
    )

    # Upload files
    success_count = 0
    failed_count = 0
    failed_files = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {}
        for file_path in files:
            # Calculate R2 key
            rel_path = file_path.relative_to(screenshots_path)
            key = f"{R2_PREFIX}{rel_path}"

            future = executor.submit(upload_file, s3_client, file_path, BUCKET_NAME, key)
            futures[future] = key

        # Process completed uploads
        for i, future in enumerate(as_completed(futures), 1):
            success, result = future.result()
            if success:
                success_count += 1
            else:
                failed_count += 1
                failed_files.append(result)

            # Progress update every 100 files
            if i % 100 == 0:
                print(f"  Progress: {i}/{total} files uploaded ({success_count} success, {failed_count} failed)")

    print()
    print("✅ Upload complete!")
    print(f"   ✅ Uploaded: {success_count}/{total}")
    print(f"   ❌ Failed: {failed_count}/{total}")

    if failed_files:
        print()
        print("Failed files:")
        for f in failed_files[:10]:  # Show first 10
            print(f"  - {f}")
        if len(failed_files) > 10:
            print(f"  ... and {len(failed_files) - 10} more")


if __name__ == "__main__":
    main()
