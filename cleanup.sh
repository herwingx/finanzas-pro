#!/bin/bash

# Cleanup script for Finanzas Pro project structure
# This removes old files from the root that belong in frontend/

echo "🧹 Cleaning up project structure..."

# Remove root-level node_modules (from old structure)
if [ -d "node_modules" ]; then
    echo "Removing root node_modules..."
    rm -rf node_modules
fi

# Remove .vite cache (from old structure)
if [ -d ".vite" ]; then
    echo "Removing .vite cache..."
    rm -rf .vite
fi

# Remove any old package files in root
if [ -f "package.json" ]; then
    echo "⚠️  Found package.json in root - this should be in frontend/ or backend/"
    echo "Please move it manually if needed"
fi

if [ -f "package-lock.json" ]; then
    echo "Removing root package-lock.json..."
    rm -f package-lock.json
fi

if [ -f "vite.config.ts" ]; then
    echo "⚠️  Found vite.config.ts in root - this should be in frontend/"
    echo "Please move it manually if needed"
fi

# Clean Docker volumes (optional)
read -p "Do you want to clean Docker volumes? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Stopping containers..."
    docker-compose down
    echo "Removing volumes..."
    docker-compose down -v
fi

echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Ensure frontend/package.json exists"
echo "2. Ensure backend/package.json exists"
echo "3. Run: cd frontend && npm install"
echo "4. Run: cd backend && npm install"
echo "5. Run: docker-compose build"
