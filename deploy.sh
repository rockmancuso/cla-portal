# Create a file called deploy.sh
#!/bin/bash
npx vite build
ls -la dist/
aws s3 sync dist/client s3://cla-member-portal/ --delete
aws cloudfront create-invalidation --distribution-id E3EFOG0IGJZ6AI --paths "/*"
echo "Deployment complete!"
echo "New asset files:"
ls -la dist/assets/