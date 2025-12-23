#!/usr/bin/env python3
"""
Upload missing screenshots to R2 (only files that don't exist yet)
Usage: python3 scripts/upload-missing-screenshots.py
"""
import os
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

BUCKET_NAME = "dobacklinks"
SCREENSHOTS_DIR = "public/screenshots/thumbnails"
MAX_WORKERS = 8

screenshots_path = Path(SCREENSHOTS_DIR)
files = list(screenshots_path.glob("**/*.webp"))

print(f"📤 Checking {len(files)} screenshots against R2...")
print()


def check_and_upload(file_path: Path):
    """Check if file exists in R2, upload if missing"""
    rel_path = file_path.relative_to(screenshots_path)
    r2_key = f"screenshots/thumbnails/{rel_path}"

    # First, try to get the object (check if it exists)
    check_cmd = ["npx", "wrangler", "r2", "object", "get", f"{BUCKET_NAME}/{r2_key}", "--file=/dev/null"]

    result = subprocess.run(check_cmd, capture_output=True, text=True)

    # If object exists, skip it
    if result.returncode == 0:
        return True, "skip", str(file_path.name)

    # Object doesn't exist, upload it
    upload_cmd = [
        "npx", "wrangler", "r2", "object", "put",
        f"{BUCKET_NAME}/{r2_key}",
        f"--file={file_path}"
    ]

    result = subprocess.run(upload_cmd, capture_output=True, text=True)

    if result.returncode == 0:
        return True, "uploaded", str(file_path.name)
    else:
        return False, "failed", str(file_path.name)


# Upload with progress tracking
success_count = 0
skip_count = 0
failed_count = 0
uploaded_count = 0
completed = 0

print("🔍 Scanning and uploading missing files...")
print()

with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
    futures = {executor.submit(check_and_upload, f): f for f in files}

    for future in as_completed(futures):
        completed += 1
        success, status, filename = future.result()

        if status == "skip":
            skip_count += 1
        elif status == "uploaded":
            uploaded_count += 1
            success_count += 1
        else:  # failed
            failed_count += 1

        # Progress every 100 files
        if completed % 100 == 0:
            print(f"  Progress: {completed}/{len(files)} | 📤 Uploaded: {uploaded_count} | ⏭️ Skipped: {skip_count} | ❌ Failed: {failed_count}")

print()
print("✅ Complete!")
print(f"   Total scanned: {completed}")
print(f"   ✅ Uploaded: {uploaded_count}")
print(f"   ⏭️ Skipped (already exists): {skip_count}")
print(f"   ❌ Failed: {failed_count}")
print(f"   📊 Success rate: {(uploaded_count / (uploaded_count + failed_count) * 100) if (uploaded_count + failed_count) > 0 else 100:.1f}%")
