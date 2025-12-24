# Blog API Documentation

This document describes the REST API endpoints for creating blog posts programmatically.

## Authentication

All API endpoints use **HMAC-SHA256** authentication to ensure request integrity and prevent replay attacks.

### HMAC Signature Generation

1. Create a canonical string:

   ```
   METHOD|PATH|TIMESTAMP|BODY
   ```

2. Generate HMAC-SHA256 signature:

   ```typescript
   const hmac = crypto.createHmac("sha256", CRON_SECRET);
   hmac.update(canonicalString);
   const signature = hmac.digest("hex");
   ```

3. Send the signature in the `Authorization` header:
   ```
   Authorization: HMAC <signature>
   ```

### Required Headers

- `Authorization: HMAC <signature>` - HMAC signature for authentication
- `X-Timestamp: <unix_timestamp_ms>` - Unix timestamp in milliseconds
- `Content-Type: application/json` - Request body format

### Security Features

- **Replay Attack Protection**: Requests older than 5 minutes are rejected
- **Clock Skew Tolerance**: Allows up to 1 minute of future timestamps
- **Constant-Time Comparison**: Prevents timing attacks on signature verification

---

## Endpoints

### POST /api/blogs

Create a new blog post.

#### Request

**Headers:**

```
Authorization: HMAC <signature>
X-Timestamp: <timestamp>
Content-Type: application/json
```

**Body:** (JSON)

| Field              | Type    | Required | Description                                                |
| ------------------ | ------- | -------- | ---------------------------------------------------------- |
| `title`            | string  | Yes      | Post title (min 3 characters)                              |
| `slug`             | string  | Yes      | URL-friendly slug (min 3 characters)                       |
| `content`          | string  | No       | Post content (Markdown supported)                          |
| `description`      | string  | No       | Post description/excerpt                                   |
| `featuredImageUrl` | string  | No       | URL to featured image (must be valid URL or empty string)  |
| `status`           | enum    | Yes      | Post status: `"draft"`, `"published"`, or `"archived"`     |
| `visibility`       | enum    | Yes      | Post visibility: `"public"` or `"logged_in"`               |
| `isPinned`         | boolean | No       | Pin post to top (default: `false`)                         |
| `tags`             | array   | No       | Array of tag objects: `[{ id: "uuid", name: "tag-name" }]` |

**Example:**

```json
{
  "title": "My New Blog Post",
  "slug": "my-new-blog-post",
  "content": "# Introduction\n\nThis is my blog post content...",
  "description": "A brief description of the post",
  "featuredImageUrl": "https://example.com/image.jpg",
  "status": "published",
  "visibility": "public",
  "isPinned": false,
  "tags": [
    { "id": "550e8400-e29b-41d4-a716-446655440000", "name": "technology" }
  ]
}
```

#### Response

**Success (200 OK):**

```json
{
  "success": true,
  "data": {
    "postId": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "my-new-blog-post"
  }
}
```

**Error Responses:**

| Status | Description                                   | Example                                                                     |
| ------ | --------------------------------------------- | --------------------------------------------------------------------------- |
| 400    | Bad Request - Invalid input data              | `{ "success": false, "error": "Invalid input data", "details": {...} }`     |
| 401    | Unauthorized - Invalid/missing HMAC signature | `{ "success": false, "error": "Authentication failed: Invalid signature" }` |
| 409    | Conflict - Slug already exists                | `{ "success": false, "error": "Slug 'my-slug' already exists" }`            |
| 500    | Internal Server Error                         | `{ "success": false, "error": "Failed to create post", "details": "..." }`  |

---

## Implementation Examples

### Node.js / TypeScript

```typescript
import crypto from "crypto";

const CRON_SECRET = process.env.CRON_SECRET!;
const API_URL = "https://dobacklinks.com";

function generateHMACSignature(
  method: string,
  path: string,
  timestamp: number,
  body: string,
): string {
  const canonicalString = `${method.toUpperCase()}|${path}|${timestamp}|${body}`;
  const hmac = crypto.createHmac("sha256", CRON_SECRET);
  hmac.update(canonicalString);
  return hmac.digest("hex");
}

async function createBlogPost(postData: any) {
  const path = "/api/blogs";
  const url = `${API_URL}${path}`;
  const timestamp = Date.now();
  const body = JSON.stringify(postData);

  const signature = generateHMACSignature("POST", path, timestamp, body);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `HMAC ${signature}`,
      "X-Timestamp": timestamp.toString(),
    },
    body: body,
  });

  return response.json();
}

// Usage
const result = await createBlogPost({
  title: "My Blog Post",
  slug: "my-blog-post",
  content: "# Hello World",
  status: "published",
  visibility: "public",
  tags: [],
});

console.log("Post created:", result.data.postId);
```

### Python

```python
import os
import hmac
import hashlib
import time
import json
import requests

CRON_SECRET = os.getenv("CRON_SECRET")
API_URL = "https://dobacklinks.com"

def generate_hmac_signature(method: str, path: str, timestamp: int, body: str) -> str:
    canonical_string = f"{method.upper()}|{path}|{timestamp}|{body}"
    signature = hmac.new(
        CRON_SECRET.encode('utf-8'),
        canonical_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return signature

def create_blog_post(post_data: dict) -> dict:
    path = "/api/blogs"
    url = f"{API_URL}{path}"
    timestamp = int(time.time() * 1000)
    body = json.dumps(post_data)

    signature = generate_hmac_signature("POST", path, timestamp, body)

    response = requests.post(
        url,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"HMAC {signature}",
            "X-Timestamp": str(timestamp),
        },
        data=body,
    )

    return response.json()

# Usage
result = create_blog_post({
    "title": "My Blog Post",
    "slug": "my-blog-post",
    "content": "# Hello World",
    "status": "published",
    "visibility": "public",
    "tags": [],
})

print(f"Post created: {result['data']['postId']}")
```

### cURL

```bash
#!/bin/bash

CRON_SECRET="your_cron_secret"
API_URL="https://dobacklinks.com"
PATH="/api/blogs"
TIMESTAMP=$(date +%s%3N)  # Unix timestamp in milliseconds

# Request body
BODY='{
  "title": "My Blog Post",
  "slug": "my-blog-post",
  "content": "# Hello World",
  "status": "published",
  "visibility": "public",
  "tags": []
}'

# Generate HMAC signature
CANONICAL_STRING="POST|${PATH}|${TIMESTAMP}|${BODY}"
SIGNATURE=$(echo -n "$CANONICAL_STRING" | openssl dgst -sha256 -hmac "$CRON_SECRET" | cut -d' ' -f2)

# Make request
curl -X POST "${API_URL}${PATH}" \
  -H "Content-Type: application/json" \
  -H "Authorization: HMAC ${SIGNATURE}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -d "$BODY"
```

---

## Testing

### Local Testing

1. Ensure `CRON_SECRET` is set in `.env.local`:

   ```bash
   CRON_SECRET=your_secret_key
   ```

2. Start development server:

   ```bash
   pnpm dev
   ```

3. Run test script:

   ```bash
   # TypeScript
   pnpm tsx scripts/test-blog-api.ts

   # Python
   python scripts/test-blog-api.py
   ```

### Production Testing

```bash
# Set environment variables
export CRON_SECRET="your_production_secret"
export API_URL="https://dobacklinks.com"

# Run test script
pnpm tsx scripts/test-blog-api.ts
```

---

## Notes

1. **System User**: Posts created via API are automatically assigned to a system user (`system@dobacklinks.com`)

2. **Path Revalidation**: Published posts automatically trigger Next.js path revalidation for:
   - `/blogs` (blog listing page)
   - `/blogs/[slug]` (individual post page)

3. **Tag Management**: Tags must be created in advance via the admin dashboard. Pass existing tag IDs in the `tags` array.

4. **Slug Uniqueness**: Each slug must be unique. If you try to create a post with an existing slug, you'll receive a 409 Conflict error.

5. **Featured Images**: The `featuredImageUrl` must be a valid URL or an empty string. Use Cloudflare R2 or another CDN for image hosting.

6. **Content Format**: The `content` field supports Markdown formatting.

---

## Error Handling

Always check the `success` field in the response:

```typescript
const result = await createBlogPost(postData);

if (result.success) {
  console.log("Post created:", result.data.postId);
} else {
  console.error("Error:", result.error);
  if (result.details) {
    console.error("Details:", result.details);
  }
}
```

---

## Security Best Practices

1. **Never commit secrets**: Keep `CRON_SECRET` in `.env.local` (not tracked by git)
2. **Use HTTPS**: Always use HTTPS in production
3. **Rotate secrets**: Periodically rotate your `CRON_SECRET`
4. **Monitor logs**: Check server logs for suspicious authentication failures
5. **Rate limiting**: Consider implementing rate limiting for production use

---

## Support

For issues or questions:

- Email: outreach@dobacklinks.com
- GitHub: [dobacklinks repository](https://github.com/yourusername/dobacklinks)
