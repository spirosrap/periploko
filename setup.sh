#!/bin/bash

echo "🎬 Setting up Periploko - Personal Movie Streaming Server"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  FFmpeg is not installed. Video transcoding features will not work."
    echo "Please install FFmpeg:"
    echo "  macOS: brew install ffmpeg"
    echo "  Ubuntu/Debian: sudo apt install ffmpeg"
    echo "  Windows: Download from https://ffmpeg.org/download.html"
fi

echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..

# Create media directory
echo "📁 Creating media directory..."
mkdir -p server/media

# Create environment file if it doesn't exist
if [ ! -f server/.env ]; then
    echo "⚙️  Creating environment file..."
    cp server/env.example server/.env
    echo "✅ Environment file created. You can edit server/.env if needed."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo "   npm run dev"
echo ""
echo "📁 Add your movie files to: server/media/"
echo "🌐 Access the web interface at: http://localhost:3000"
echo ""
echo "📖 For more information, see README.md" 