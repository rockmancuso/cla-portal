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

# THE RENEWAL UI ELEMENTS WILL NOT SHOW WITH THE FLAG IN FRONT OF `npx vite build`
echo "Building project..."
VITE_HIDE_RENEWAL_UI=true npx vite build

echo "Listing build output:"
ls -la dist/

echo "Syncing to S3..."
aws s3 sync dist/client "$S3_BUCKET" --delete

echo "Invalidating CloudFront cache (running in background)..."
aws cloudfront create-invalidation --distribution-id E3EFOG0IGJZ6AI --paths "/*" &

echo "Deployment complete! (Note: CloudFront cache invalidation is running in the background)"
echo "New asset files:"
ls -la dist/client

# Function to update Lambda with error handling
update_lambda() {
    echo "Creating Lambda deployment package..."
    if ! cd hubspot-proxy; then
        echo "❌ Failed to change to hubspot-proxy directory"
        return 1
    fi
    
    if ! zip -r ../hubspot-proxy.zip .; then
        echo "❌ Failed to create zip file"
        cd ..
        return 1
    fi
    
    if ! aws lambda update-function-code \
        --function-name hubspot-proxy \
        --zip-file fileb://../hubspot-proxy.zip \
        --region us-east-1; then
        echo "❌ Failed to update Lambda function"
        cd ..
        rm -f hubspot-proxy.zip
        return 1
    fi
    
    cd ..
    rm -f hubspot-proxy.zip
    echo "✅ Lambda function updated successfully"
    return 0
}

# Prompt for Lambda update
read -p "Do you want to update the HubSpot proxy Lambda function? (y/n) " -n 1 -r
echo    # Move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
    if update_lambda; then
        echo "Lambda update completed successfully"
    else
        echo "Lambda update failed"
        exit 1
    fi
else
    echo "Skipping Lambda update"
fi