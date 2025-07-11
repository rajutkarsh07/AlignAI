#!/bin/bash

echo "🚀 Roadmap Assistant Setup Script"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB first."
    echo "   You can download it from: https://www.mongodb.com/try/download/community"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p server/uploads
mkdir -p client/public

# Install dependencies
echo "📦 Installing dependencies..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install
cd ..

# Copy environment files
echo "⚙️  Setting up environment files..."

if [ ! -f "server/.env" ]; then
    cp server/env.example server/.env
    echo "✅ Created server/.env (please configure it)"
else
    echo "⚠️  server/.env already exists"
fi

if [ ! -f "client/.env" ]; then
    cp client/env.example client/.env
    echo "✅ Created client/.env (please configure it)"
else
    echo "⚠️  client/.env already exists"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Configure your environment files:"
echo "   - server/.env: Set your MongoDB URI and Google Cloud credentials"
echo "   - client/.env: Set your API URL"
echo ""
echo "2. Set up Google Cloud Vertex AI:"
echo "   - Create a Google Cloud project"
echo "   - Enable Vertex AI API"
echo "   - Create a service account and download the key"
echo "   - Update server/.env with your project details"
echo ""
echo "3. Start the application:"
echo "   npm run dev"
echo ""
echo "4. Open your browser to: http://localhost:3000"
echo ""
echo "📚 For more information, see the README.md file" 