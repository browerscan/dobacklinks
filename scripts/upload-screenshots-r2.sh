#!/bin/bash
# Fast parallel upload to R2

set -e

BUCKET_NAME="dobacklinks"
SCREENSHOTS_DIR="public/screenshots/thumbnails"
PARALLEL_JOBS=10  # Number of parallel uploads
TEMP_DIR=$(mktemp -d)

echo "📤 Uploading screenshots to R2 ($PARALLEL_JOBS parallel jobs)"
echo "📁 Source: $SCREENSHOTS_DIR"
echo ""

# Count total files
TOTAL=$(find "$SCREENSHOTS_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')
echo "📊 Total files: $TOTAL"
echo ""

# Upload function
upload_file() {
    local file="$1"
    local rel_path="${file#$SCREENSHOTS_DIR/}"
    local r2_key="screenshots/thumbnails/$rel_path"

    if npx wrangler r2 object put "$BUCKET_NAME/$r2_key" --file="$file" > /dev/null 2>&1; then
        echo "✓" > "$TEMP_DIR/success_$(basename "$file" | tr -cd '0-9').txt"
    else
        echo "✗ $rel_path" >> "$TEMP_DIR/failed.txt"
    fi
}
export -f upload_file
export BUCKET_NAME SCREENSHOTS_DIR TEMP_DIR

# Export variables for GNU parallel or xargs
export BUCKET_NAME SCREENSHOTS_DIR

# Use xargs for parallel processing (faster than sequential)
find "$SCREENSHOTS_DIR" -type f -print0 | xargs -0 -P $PARALLEL_JOBS -I {} bash -c '
    file="$1"
    rel_path="${file#'/$SCREENSHOTS_DIR/}"
    r2_key="screenshots/thumbnails/${rel_path#/}"

    if npx wrangler r2 object put "$BUCKET_NAME/$r2_key" --file="$file" > /dev/null 2>&1; then
        echo "✓"
    else
        echo "✗ $r2_key" >&2
    fi
' bash {}

# Alternative: Simple sequential with progress (works everywhere)
echo "📤 Starting upload..."
COUNT=0
SUCCESS=0

find "$SCREENSHOTS_DIR" -type f | while read -r file; do
    rel_path="${file#$SCREENSHOTS_DIR/}"
    r2_key="screenshots/thumbnails/$rel_path"

    if npx wrangler r2 object put "$BUCKET_NAME/$r2_key" --file="$file" > /dev/null 2>&1; then
        SUCCESS=$((SUCCESS + 1))
    fi

    COUNT=$((COUNT + 1))

    if [ $((COUNT % 100)) -eq 0 ]; then
        echo "  Progress: $COUNT/$TOTAL files uploaded..."
    fi
done

echo ""
echo "✅ Upload complete!"
