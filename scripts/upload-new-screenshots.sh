#!/bin/bash
# Upload new screenshots to R2 (last 24 hours)

ACCOUNT_ID="9cb8d6ec0f6094cf4f0cd6b3ee5a17a3"
BUCKET="dobacklinks"
COUNT=0
FAILED=0

echo "📤 Uploading new screenshots to R2..."
echo "======================================"

cd public

# Upload screenshots (full size)
find screenshots -type f -name "*.webp" -mtime -1 ! -path "*/thumbnails/*" | while read file; do
  COUNT=$((COUNT + 1))
  KEY="$file"

  if npx wrangler r2 object put "$BUCKET/$KEY" --file="$file" --content-type="image/webp" 2>/dev/null; then
    echo "✅ [$COUNT] $KEY"
  else
    echo "❌ [$COUNT] Failed: $KEY"
    FAILED=$((FAILED + 1))
  fi
done

# Upload thumbnails
find screenshots/thumbnails -type f -name "*-thumb.webp" -mtime -1 | while read file; do
  COUNT=$((COUNT + 1))
  KEY="$file"

  if npx wrangler r2 object put "$BUCKET/$KEY" --file="$file" --content-type="image/webp" 2>/dev/null; then
    echo "✅ [$COUNT] $KEY"
  else
    echo "❌ [$COUNT] Failed: $KEY"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "======================================"
echo "✅ Upload complete"
echo "   Uploaded: $COUNT files"
echo "   Failed: $FAILED files"
