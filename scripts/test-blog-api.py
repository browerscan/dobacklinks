#!/usr/bin/env python3
"""
Test script for /api/blogs endpoint (Python version)

Usage:
    python scripts/test-blog-api.py

Environment:
    CRON_SECRET - Required: HMAC secret key
    API_URL - Optional: API endpoint URL (default: http://localhost:3000)
"""

import os
import sys
import json
import time
import hmac
import hashlib
import requests
from datetime import datetime

# Configuration
API_URL = os.getenv("API_URL", "http://localhost:3000")
CRON_SECRET = os.getenv("CRON_SECRET")

if not CRON_SECRET:
    print("❌ Error: CRON_SECRET environment variable is required")
    print("💡 Set it in .env.local or run: CRON_SECRET=your_secret python scripts/test-blog-api.py")
    sys.exit(1)


def generate_hmac_signature(method: str, path: str, timestamp: int, body: str, secret: str) -> str:
    """
    Generate HMAC signature for API request
    """
    canonical_string = f"{method.upper()}|{path}|{timestamp}|{body}"
    signature = hmac.new(
        secret.encode('utf-8'),
        canonical_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return signature


def create_blog_post(post_data: dict) -> dict:
    """
    Create a blog post via API
    """
    path = "/api/blogs"
    url = f"{API_URL}{path}"
    timestamp = int(time.time() * 1000)  # Unix timestamp in milliseconds
    body = json.dumps(post_data)

    # Generate HMAC signature
    signature = generate_hmac_signature("POST", path, timestamp, body, CRON_SECRET)

    print("🔐 Request details:")
    print(f"   URL: {url}")
    print(f"   Timestamp: {timestamp}")
    print(f"   Signature: {signature[:16]}...")
    print()

    try:
        response = requests.post(
            url,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"HMAC {signature}",
                "X-Timestamp": str(timestamp),
            },
            data=body,
        )

        result = response.json()

        if response.ok:
            print("✅ Success!")
            print(f"   Response: {json.dumps(result, indent=2)}")
            return result
        else:
            print(f"❌ Error: HTTP {response.status_code}")
            print(f"   Response: {json.dumps(result, indent=2)}")
            sys.exit(1)

    except Exception as error:
        print(f"❌ Request failed: {error}")
        sys.exit(1)


def main():
    print("🚀 Testing /api/blogs endpoint\n")

    # Test data
    test_post = {
        "title": "Test Blog Post from Python API",
        "slug": f"test-python-api-post-{int(time.time())}",
        "content": f"""# Test Blog Post from Python

This is a test blog post created via the API endpoint using Python.

## Features

- HMAC authentication
- Automatic system user creation
- Tag association support
- Path revalidation

**Created at:** {datetime.now().isoformat()}
""",
        "description": "A test blog post created via Python API for testing purposes",
        "status": "published",
        "visibility": "public",
        "isPinned": False,
        "featuredImageUrl": "",
        "tags": [],  # Add tag IDs here if needed
    }

    print("📝 Creating blog post:")
    print(f"   Title: {test_post['title']}")
    print(f"   Slug: {test_post['slug']}")
    print(f"   Status: {test_post['status']}")
    print()

    result = create_blog_post(test_post)

    if result.get("success") and result.get("data"):
        print()
        print("🎉 Blog post created successfully!")
        print(f"   Post ID: {result['data']['postId']}")
        print(f"   Slug: {result['data']['slug']}")
        print(f"   View at: {API_URL}/blogs/{result['data']['slug']}")


if __name__ == "__main__":
    main()
