#!/bin/bash
set -e

# Configurable variables
S3_BUCKET="s3://cla-member-portal/"
CLOUDFRONT_DIST_ID="E3EFOG0IGJZ6AI"

# Check for required tools
command -v aws >/dev/null 2>&1 || { echo >&2 "aws CLI not installed. Aborting."; exit 1; }
command -v npx >/dev/null 2>&1 || { echo >&2 "npx not found. Aborting."; exit 1; }

echo "Cleaning previous build..."
rm -rf dist/

echo "Building project..."
npx vite build

echo "Listing build output:"
ls -la dist/

echo "Syncing to S3..."
aws s3 sync dist/client "$S3_BUCKET" --delete

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DIST_ID" --paths "/*"

echo "Deployment complete!"
echo "New asset files:"
ls -la dist/client