#!/usr/bin/env python3
"""
Retry failed screenshot uploads to R2
Usage: python3 scripts/retry-upload-screenshots.py
"""
import os
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

BUCKET_NAME = "dobacklinks"
SCREENSHOTS_DIR = "public/screenshots/thumbnails"
MAX_WORKERS = 10  # Reduced for retry

screenshots_path = Path(SCREENSHOTS_DIR)
files = list(screenshots_path.glob("**/*.webp"))

print(f"📤 Retrying upload of {len(files)} screenshots to R2")
print()


def upload_file(file_path: Path):
    """Upload a single file using wrangler"""
    rel_path = file_path.relative_to(screenshots_path)
    r2_key = f"screenshots/thumbnails/{rel_path}"

    cmd = [
        "npx", "wrangler", "r2", "object", "put",
        f"{BUCKET_NAME}/{r2_key}",
        f"--file={file_path}"
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0, str(file_path.name)


# Upload with reduced concurrency
success_count = 0
failed_count = 0
completed = 0

with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
    futures = {executor.submit(upload_file, f): f for f in files}

    for future in as_completed(futures):
        completed += 1
        success, filename = future.result()

        if success:
            success_count += 1
        else:
            failed_count += 1

        # Progress every 50 files
        if completed % 50 == 0:
            print(f"  Progress: {completed}/{len(files)} (✓{success_count} ✗{failed_count})")

print()
print("✅ Upload complete!")
print(f"   Uploaded: {success_count}/{len(files)}")
print(f"   Failed: {failed_count}/{len(files)}")
