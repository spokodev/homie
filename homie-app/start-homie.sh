#!/bin/bash

# Homie Quick Start Script
echo "🏠 Starting Homie App..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Creating .env.local from template..."
    cp .env.local.template .env.local
    echo "📝 Please edit .env.local with your credentials before continuing."
    echo "   You need:"
    echo "   - Supabase URL and Anon Key"
    echo "   - Apple Team ID (for iOS builds)"
    echo ""
    echo "Press Enter when ready to continue..."
    read
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Clear cache
echo "🧹 Clearing cache..."
npx expo start --clear

echo "✅ Homie is starting!"
echo ""
echo "📱 To run on your iPhone:"
echo "   1. Download 'Expo Go' from App Store"
echo "   2. Scan the QR code above"
echo "   3. Or press 'i' for iOS Simulator"
echo ""
echo "Happy home management! 🎉"