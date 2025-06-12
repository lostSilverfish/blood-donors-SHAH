#!/bin/bash

# Blood Donor Registry - Production Deployment Script

echo "🚀 Starting production deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    echo "❌ Error: This script must be run from the project root directory"
    exit 1
fi

# Check if config.env exists
if [ ! -f "backend/config.env" ]; then
    echo "❌ Error: backend/config.env not found"
    echo "📋 Please copy env.production.template to backend/config.env and configure it"
    exit 1
fi

# Build frontend
echo "🏗️  Building frontend..."
cd frontend
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend build completed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd ../backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Backend dependency installation failed"
    exit 1
fi

echo "✅ Backend dependencies installed"

# Check if admin user exists (optional)
echo "👤 Checking admin user setup..."
echo "Run 'node create-admin-user.js' if you need to create an admin user"

echo "🎉 Deployment preparation completed!"
echo ""
echo "🚀 To start the production server:"
echo "   cd backend && npm start"
echo ""
echo "🔍 Health check will be available at:"
echo "   http://localhost:3000/health"
echo ""
echo "📖 API documentation available at:"
echo "   http://localhost:3000/api" 