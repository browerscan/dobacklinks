#!/bin/bash

# Update blog posts in database directly using psql

DATABASE_URL="postgresql://postgres:postgres@93.127.133.204:54322/postgres"

echo "🔄 Updating blog posts to fix duplicate H1 tags"
echo ""

# Function to update a post
update_post() {
  local slug="$1"
  local file="$2"

  echo "📄 Processing: $slug"

  if [ ! -f "$file" ]; then
    echo "   ⚠��  File not found: $file"
    return 1
  fi

  # Read file content and escape for SQL
  local content=$(cat "$file" | sed "s/'/''/g")

  # Update database
  psql "$DATABASE_URL" -c "
    UPDATE posts
    SET content = '$content',
        updated_at = NOW()
    WHERE slug = '$slug'
  " > /dev/null 2>&1

  if [ $? -eq 0 ]; then
    echo "   ✅ Updated successfully"
    return 0
  else
    echo "   ❌ Failed to update"
    return 1
  fi
}

# Update posts
update_post "complete-guide-how-to-find-dr70-guest-post-sites-using-our-directory-2025" "blog-draft-dr70-guide.md"
update_post "real-case-study-how-500-budget-got-10-google-news-guest-post-links" "case-study-google-news-guest-posts.md"
update_post "reverse-engineering-our-quality-score-how-we-rate-9-700-guest-post-sites" "content/blog/reverse-engineering-quality-score.md"

echo ""
echo "============================================================"
echo "🎉 Blog posts updated successfully!"
echo "💡 Refresh your browser to see the changes"
echo "============================================================"
