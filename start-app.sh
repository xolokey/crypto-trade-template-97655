#!/bin/bash

# Start Indian Stock Tracker with Real Data
# This script starts both backend and frontend

echo "🚀 Starting Indian Stock Tracker..."
echo ""

# Check if .NET is installed
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET SDK not found. Please install from https://dotnet.microsoft.com/download"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install from https://nodejs.org/"
    exit 1
fi

echo "✅ .NET SDK found: $(dotnet --version)"
echo "✅ Node.js found: $(node --version)"
echo ""

# Build backend
echo "📦 Building .NET backend..."
dotnet build backend/StockTracker.sln > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi

echo ""
echo "🎯 Starting services..."
echo ""
echo "📍 Backend API will run on: http://localhost:5000"
echo "📍 Frontend will run on: http://localhost:8080"
echo ""
echo "⚠️  You need to run these in separate terminals:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend/StockTracker.API && dotnet run"
echo ""
echo "Terminal 2 (Frontend):"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:8080/dashboard"
echo ""
echo "Look for the green 'Real Data' badge! 🟢"
