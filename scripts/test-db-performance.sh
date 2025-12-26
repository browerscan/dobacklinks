#!/bin/bash

# Test Database Performance Monitoring
# This script tests the performance monitoring system

set -e

echo "========================================="
echo "Database Performance Monitoring Test"
echo "========================================="
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "Error: Dev server is not running on http://localhost:3000"
    echo "Please start it first with: pnpm dev"
    exit 1
fi

echo "1. Testing performance summary endpoint..."
curl -s http://localhost:3000/api/debug/performance | jq '.'

echo ""
echo "2. Testing performance with statistics..."
curl -s "http://localhost:3000/api/debug/performance?includeStats=true" | jq '.'

echo ""
echo "3. Testing performance with slow queries..."
curl -s "http://localhost:3000/api/debug/performance?includeSlowQueries=true&includeStats=true" | jq '.'

echo ""
echo "4. Testing reset endpoint..."
curl -s -X POST http://localhost:3000/api/debug/performance \
    -H "Content-Type: application/json" \
    -d '{"action":"reset"}' | jq '.'

echo ""
echo "========================================="
echo "Test completed successfully!"
echo "========================================="
echo ""
echo "Note: For manual testing, use the curl commands displayed in the test output."
