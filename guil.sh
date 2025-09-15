#!/usr/bin/env bash

# cli.sh - Build and run the Guillotine CLI
#
# This script automatically:
# 1. Builds the Zig library (if not already built)
# 2. Builds the Go CLI (if needed or source changed)
# 3. Sets up library paths correctly
# 4. Runs the CLI with all provided arguments
#
# Usage: 
#   ./cli.sh                    # Launch interactive TUI
#   ./cli.sh [command] [flags]  # Run specific command
#
# Examples:
#   ./cli.sh tui                                         # Launch TUI
#   ./cli.sh call --caller 0x1234... --to 0x5678... --gas 100000
#   ./cli.sh estimategas --from 0x1234... --to 0x5678... --value 1000
#   ./cli.sh compile --file contract.sol --format json
#   ./cli.sh trace --bytecode bytecode.hex --out trace.json

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Build the Zig library if needed
if [ ! -f "zig-out/lib/libguillotine.dylib" ] && [ ! -f "zig-out/lib/libguillotine.so" ]; then
    echo -e "${YELLOW}Building Guillotine library...${NC}"
    zig build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Guillotine library built successfully${NC}"
    else
        echo -e "${RED}✗ Failed to build Guillotine library${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Guillotine library already built${NC}"
fi

# Set the library path based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    export DYLD_LIBRARY_PATH="${SCRIPT_DIR}/zig-out/lib:${DYLD_LIBRARY_PATH}"
    LIB_FILE="zig-out/lib/libguillotine.dylib"
else
    # Linux
    export LD_LIBRARY_PATH="${SCRIPT_DIR}/zig-out/lib:${LD_LIBRARY_PATH}"
    LIB_FILE="zig-out/lib/libguillotine.so"
fi

# Check if library exists
if [ ! -f "$LIB_FILE" ]; then
    echo -e "${RED}✗ Library not found at $LIB_FILE${NC}"
    echo -e "${YELLOW}Running 'zig build' to create it...${NC}"
    zig build
    if [ ! -f "$LIB_FILE" ]; then
        echo -e "${RED}✗ Failed to create library${NC}"
        exit 1
    fi
fi

# Build the Go CLI if needed or if source files have changed
CLI_DIR="apps/cli"
CLI_BINARY="$CLI_DIR/guillotine-cli"

# Function to check if rebuild is needed
needs_rebuild() {
    # If binary doesn't exist, rebuild
    if [ ! -f "$CLI_BINARY" ]; then
        return 0
    fi
    
    # Check if any Go files are newer than the binary
    if find "$CLI_DIR" -name "*.go" -newer "$CLI_BINARY" 2>/dev/null | grep -q .; then
        return 0
    fi
    
    # Check if any Go files in the SDK are newer than the binary
    if find "sdks/go" -name "*.go" -newer "$CLI_BINARY" 2>/dev/null | grep -q .; then
        return 0
    fi
    
    return 1
}

if needs_rebuild; then
    echo -e "${YELLOW}Building CLI...${NC}"
    cd "$CLI_DIR"
    go build -o guillotine-cli .
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ CLI built successfully${NC}"
    else
        echo -e "${RED}✗ Failed to build CLI${NC}"
        exit 1
    fi
    cd "$SCRIPT_DIR"
else
    echo -e "${GREEN}✓ CLI is up to date${NC}"
fi

# Run the CLI with all passed arguments
echo -e "${GREEN}Running Guillotine CLI...${NC}"
echo "----------------------------------------"
exec "$CLI_BINARY" "$@"