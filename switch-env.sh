#!/bin/bash

# SD Tasks Environment Switcher
# Usage: ./switch-env.sh [web|android]

if [ "$1" = "android" ]; then
    echo "🔄 Switching to Android emulator configuration..."
    sed -i '' 's/localhost:3000/10.0.2.2:3000/g' .env
    echo "✅ API_BASE_URL set to http://10.0.2.2:3000/api (Android emulator)"
    echo "📱 Ready for: npx cap run android"
elif [ "$1" = "web" ]; then
    echo "🔄 Switching to web development configuration..."
    sed -i '' 's/10.0.2.2:3000/localhost:3000/g' .env
    echo "✅ API_BASE_URL set to http://localhost:3000/api (Web development)"
    echo "🌐 Ready for: npm run dev"
else
    echo "📋 Current API configuration:"
    grep "VITE_API_BASE_URL" .env
    echo ""
    echo "Usage: ./switch-env.sh [web|android]"
    echo "  web     - Set API URL for web development (localhost:3000)"
    echo "  android - Set API URL for Android emulator (10.0.2.2:3000)"
fi