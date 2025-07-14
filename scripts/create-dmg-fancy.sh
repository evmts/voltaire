#!/bin/bash

# Create a fancy DMG for Guillotine Devtool
# This creates a professional-looking DMG with custom appearance

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Creating Guillotine Devtool DMG with custom appearance...${NC}"

# Configuration
APP_NAME="GuillotineDevtool"
DMG_NAME="GuillotineDevtool-Installer"
VOLUME_NAME="Guillotine Devtool"
SOURCE_APP="macos/$APP_NAME.app"
OUTPUT_DIR="zig-out"
DMG_PATH="$OUTPUT_DIR/$DMG_NAME.dmg"
TEMP_DMG="$OUTPUT_DIR/temp.dmg"

# Remove old DMG if it exists
rm -f "$DMG_PATH" "$TEMP_DMG"

# Unmount any existing volumes with the same name
MOUNT_POINT="/Volumes/$VOLUME_NAME"
echo "Checking for existing volumes..."
if [ -d "$MOUNT_POINT" ]; then
    echo "Unmounting existing volume..."
    hdiutil detach "$MOUNT_POINT" -force 2>/dev/null || true
fi

# Create a temporary DMG (with read/write support)
echo "Creating temporary DMG..."
hdiutil create -size 100m -fs HFS+ -volname "$VOLUME_NAME" "$TEMP_DMG"

# Mount the temporary DMG with read/write access
echo "Mounting temporary DMG..."
DEVICE=$(hdiutil attach -readwrite -noverify -noautoopen "$TEMP_DMG" | egrep '^/dev/' | sed 1q | awk '{print $1}')
MOUNT_POINT="/Volumes/$VOLUME_NAME"

# Copy app to DMG
echo "Copying application..."
cp -R "$SOURCE_APP" "$MOUNT_POINT/"

# Create Applications symlink
echo "Creating Applications symlink..."
ln -s /Applications "$MOUNT_POINT/Applications"

# Set custom icon positions and window properties using AppleScript
echo "Setting custom appearance..."
osascript <<EOD
tell application "Finder"
    tell disk "$VOLUME_NAME"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {400, 100, 900, 400}
        set viewOptions to the icon view options of container window
        set arrangement of viewOptions to not arranged
        set icon size of viewOptions to 72
        set background color of viewOptions to {65535, 65535, 65535}
        set position of item "$APP_NAME.app" of container window to {125, 150}
        set position of item "Applications" of container window to {375, 150}
        close
        open
        update without registering applications
        delay 2
    end tell
end tell
EOD

# Sync and unmount
echo "Finalizing DMG..."
sync
hdiutil detach "$DEVICE" -quiet

# Convert to compressed DMG
echo "Compressing DMG..."
hdiutil convert "$TEMP_DMG" -format UDZO -imagekey zlib-level=9 -o "$DMG_PATH"

# Clean up
rm -f "$TEMP_DMG"

# Set permissions
chmod 644 "$DMG_PATH"

echo -e "${GREEN}DMG created successfully at: $DMG_PATH${NC}"

# Optional: Open the DMG to verify
echo -e "${YELLOW}Opening DMG for verification...${NC}"
open "$DMG_PATH"