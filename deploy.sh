#!/bin/bash

# AWS Practice App Deployment Script

echo "🚀 Starting deployment process..."

# Build the React client for production
echo "📦 Building React client..."
cd client
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Client build successful!"
else
    echo "❌ Client build failed!"
    exit 1
fi

cd ..

# Create deployment package for server
echo "📦 Preparing server deployment package..."
mkdir -p deploy/server
cp -r server/* deploy/server/
cp .env.production deploy/server/.env

# Remove development dependencies and files
rm -rf deploy/server/node_modules
rm -rf deploy/server/logs
rm -rf deploy/server/test-data

echo "✅ Deployment package ready!"
echo ""
echo "📋 Next steps:"
echo "1. Upload client/build/* to S3 bucket for aws.milan-pokhrel.com.np"
echo "2. Configure CloudFront distribution"
echo "3. Upload deploy/server/* to EC2 instance"
echo "4. Set up RDS database and update DATABASE_URL in .env"
echo "5. Install dependencies on EC2: npm install --production"
echo "6. Start the server: npm start"
echo ""
echo "🌐 Your app will be available at:"
echo "   Frontend: https://aws.milan-pokhrel.com.np"
echo "   Backend:  https://api.milan-pokhrel.com.np"