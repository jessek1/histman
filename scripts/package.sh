#!/bin/bash

# HistMan Package Script
# Creates a ZIP package for Chrome Web Store submission

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SRC_DIR="$PROJECT_ROOT/src"
DIST_DIR="$PROJECT_ROOT/dist"

# Read current version from manifest
MANIFEST="$SRC_DIR/manifest.json"
CURRENT_VERSION=$(grep -o '"version": "[^"]*"' "$MANIFEST" | cut -d'"' -f4)

echo -e "${GREEN}HistMan Packager${NC}"
echo "================================"
echo -e "Current version: ${YELLOW}$CURRENT_VERSION${NC}"
echo ""

# Check for version argument
if [ -n "$1" ]; then
    NEW_VERSION="$1"

    # Validate version format (x.y.z)
    if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo -e "${RED}Error: Invalid version format. Use x.y.z (e.g., 1.0.1)${NC}"
        exit 1
    fi

    # Update manifest version
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$MANIFEST"
    else
        # Linux
        sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$MANIFEST"
    fi

    echo -e "Updated version: ${GREEN}$NEW_VERSION${NC}"
    VERSION="$NEW_VERSION"
else
    VERSION="$CURRENT_VERSION"
    echo "No version specified, using current version"
fi

echo ""

# Create dist directory if it doesn't exist
mkdir -p "$DIST_DIR"

# Package filename
PACKAGE_NAME="histman-v${VERSION}.zip"
PACKAGE_PATH="$DIST_DIR/$PACKAGE_NAME"

# Remove old package if exists
if [ -f "$PACKAGE_PATH" ]; then
    rm "$PACKAGE_PATH"
    echo -e "${YELLOW}Removed existing package${NC}"
fi

# Create the ZIP package
echo "Creating package..."
cd "$SRC_DIR"
zip -r "$PACKAGE_PATH" . -x "*.DS_Store" -x "*.map" -x "*.log"

# Get package size
PACKAGE_SIZE=$(du -h "$PACKAGE_PATH" | cut -f1)

echo ""
echo -e "${GREEN}Package created successfully!${NC}"
echo "================================"
echo -e "File: ${YELLOW}$PACKAGE_PATH${NC}"
echo -e "Size: ${YELLOW}$PACKAGE_SIZE${NC}"
echo -e "Version: ${YELLOW}$VERSION${NC}"
echo ""

# List package contents
echo "Package contents:"
unzip -l "$PACKAGE_PATH" | tail -n +4 | head -n -2

echo ""
echo -e "${GREEN}Ready for Chrome Web Store upload!${NC}"
