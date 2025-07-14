#!/bin/bash

# Create DMG for Guillotine Devtool
# This script creates a macOS DMG installer with drag-and-drop interface

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Creating Guillotine Devtool DMG...${NC}"

# Configuration
APP_NAME="GuillotineDevtool"
DMG_NAME="GuillotineDevtool-Installer"
VOLUME_NAME="Guillotine Devtool"
SOURCE_DIR="macos"
OUTPUT_DIR="zig-out"

# Create temporary directory for DMG contents
TEMP_DIR=$(mktemp -d)
echo "Using temp directory: $TEMP_DIR"

# Copy app bundle to temp directory
echo "Copying app bundle..."
cp -R "$SOURCE_DIR/$APP_NAME.app" "$TEMP_DIR/"

# Create Applications symlink in temp directory
echo "Creating Applications symlink..."
ln -s /Applications "$TEMP_DIR/Applications"

# Create DMG
echo "Creating DMG..."
hdiutil create -volname "$VOLUME_NAME" \
    -srcfolder "$TEMP_DIR" \
    -ov \
    -format UDZO \
    "$OUTPUT_DIR/$DMG_NAME.dmg"

# Clean up
echo "Cleaning up..."
rm -rf "$TEMP_DIR"

echo -e "${GREEN}DMG created successfully at: $OUTPUT_DIR/$DMG_NAME.dmg${NC}"

# Optional: Open the DMG to verify
echo -e "${YELLOW}Opening DMG for verification...${NC}"
open "$OUTPUT_DIR/$DMG_NAME.dmg"