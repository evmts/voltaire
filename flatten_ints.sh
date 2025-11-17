#!/bin/bash

# Flatten all Int types by moving BrandedIntX subdirectories to parent

set -e

PRIMITIVES_DIR="/Users/williamcory/voltaire/src/primitives"

for bits in 8 16 32 64 128 256; do
  INT_DIR="$PRIMITIVES_DIR/Int$bits"
  BRANDED_DIR="$INT_DIR/BrandedInt$bits"

  if [ ! -d "$BRANDED_DIR" ]; then
    echo "Skipping Int$bits - BrandedInt$bits not found"
    continue
  fi

  echo "Processing Int$bits..."

  # 1. Rename BrandedInt*.ts to Int*Type.ts and move to parent
  if [ -f "$BRANDED_DIR/BrandedInt$bits.ts" ]; then
    mv "$BRANDED_DIR/BrandedInt$bits.ts" "$INT_DIR/Int${bits}Type.ts"
    echo "  - Created Int${bits}Type.ts"
  fi

  # 2. Move all .js files to parent
  for file in "$BRANDED_DIR"/*.js; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      mv "$file" "$INT_DIR/$filename"
      echo "  - Moved $filename"
    fi
  done

  # 3. Delete old index.ts in parent (will recreate)
  rm -f "$INT_DIR/index.ts"

  # 4. Move BrandedInt index.ts to parent
  if [ -f "$BRANDED_DIR/index.ts" ]; then
    mv "$BRANDED_DIR/index.ts" "$INT_DIR/index.ts"
    echo "  - Moved index.ts"
  fi

  # 5. Remove empty BrandedInt directory
  rmdir "$BRANDED_DIR"
  echo "  - Removed BrandedInt$bits directory"

  echo "  ✓ Int$bits flattened"
done

echo ""
echo "All Int types flattened successfully!"
