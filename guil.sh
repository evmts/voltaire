#!/usr/bin/env bash

# guil.sh - Build and run the Guillotine CLI
#
# This script automatically:
# 1. Builds the Zig library (if not already built)
# 2. Builds the Go CLI (if needed or source changed)
# 3. Sets up library paths correctly
# 4. Runs the CLI with all provided arguments
#
# Usage: 
#   ./guil.sh                    # Launch interactive TUI
#   ./guil.sh [command] [flags]  # Run specific command
#   ./guil.sh --docker [command] [flags]  # Run in Docker mode with special library setup
#
# Examples:
#   ./guil.sh tui                                         # Launch TUI
#   ./guil.sh call --caller 0x1234... --to 0x5678... --gas 100000
#   ./guil.sh estimategas --from 0x1234... --to 0x5678... --value 1000
#   ./guil.sh compile --file contract.sol --format json
#   ./guil.sh trace --bytecode bytecode.hex --out trace.json
#   ./guil.sh --docker tui                               # Launch TUI in Docker mode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Check for --docker flag
DOCKER_MODE=false
if [ "$1" == "--docker" ]; then
    DOCKER_MODE=true
    shift # Remove --docker from arguments
fi

# Docker mode: Check if we need to rebuild with proper BLS exports
if [ "$DOCKER_MODE" = true ] && [ ! -f "zig-out/lib/.docker-built" ]; then
    echo -e "${YELLOW}Rebuilding Guillotine library with proper BLS exports for Docker...${NC}"
    
    # Clean and rebuild with all symbols exported
    rm -rf zig-out zig-cache .zig-cache
    zig build
    
    # Mark as built for Docker
    touch zig-out/lib/.docker-built
    
    echo -e "${GREEN}✓ Guillotine library rebuilt for Docker${NC}"
fi

# Build the Zig library if needed (normal mode or if not built yet)
if [ ! -f "zig-out/lib/libguillotine_ffi.dylib" ] && [ ! -f "zig-out/lib/libguillotine_ffi.so" ]; then
    echo -e "${YELLOW}Building Guillotine library...${NC}"
    zig build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Guillotine library built successfully${NC}"
    else
        echo -e "${RED}✗ Failed to build Guillotine library${NC}"
        exit 1
    fi
else
    if [ "$DOCKER_MODE" = false ]; then
        echo -e "${GREEN}✓ Guillotine library already built${NC}"
    fi
fi

# Set the library path based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    export DYLD_LIBRARY_PATH="${SCRIPT_DIR}/zig-out/lib:${DYLD_LIBRARY_PATH}"
    LIB_FILE="zig-out/lib/libguillotine_ffi.dylib"
else
    # Linux
    export LD_LIBRARY_PATH="${SCRIPT_DIR}/zig-out/lib:${LD_LIBRARY_PATH}"
    LIB_FILE="zig-out/lib/libguillotine_ffi.so"
    # For Linux, we need to ensure proper library linking
    export CGO_LDFLAGS="-L${SCRIPT_DIR}/zig-out/lib -lguillotine_ffi -lblst -lbn254 -lc_kzg_4844 -lgmp -lm"
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
    
    # Docker mode needs special build handling
    if [ "$DOCKER_MODE" = true ]; then
        echo -e "${YELLOW}Building CLI with Docker-specific settings...${NC}"
        
        # Try building with verbose output to debug linking issues if needed
        go build -v -o guillotine-cli . 2>&1 | grep -E "(link|ld:|undefined)" || true
        if [ ${PIPESTATUS[0]} -ne 0 ]; then
            echo -e "${RED}✗ Failed to build CLI${NC}"
            echo -e "${YELLOW}Attempting fallback build with static BLS libraries...${NC}"
            
            # Try again with explicit static library paths
            CGO_LDFLAGS="-L${SCRIPT_DIR}/zig-out/lib -lguillotine_ffi_static -lblst -lbn254 -lc_kzg_4844 -lgmp -lm" \
            go build -o guillotine-cli .
            
            if [ $? -ne 0 ]; then
                echo -e "${RED}✗ Failed to build CLI even with static libraries${NC}"
                exit 1
            fi
        fi
    else
        # Normal build
        if [[ "$OSTYPE" != "darwin"* ]]; then
            # Linux - explicitly link BLS libraries
            export CGO_LDFLAGS="-L${SCRIPT_DIR}/zig-out/lib"
        fi
        go build -o guillotine-cli .
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ CLI built successfully${NC}"
        else
            echo -e "${RED}✗ Failed to build CLI${NC}"
            exit 1
        fi
    fi
    
    cd "$SCRIPT_DIR"
else
    echo -e "${GREEN}✓ CLI is up to date${NC}"
fi

# Run the CLI with all passed arguments
if [ "$DOCKER_MODE" = true ]; then
    echo -e "${GREEN}Running Guillotine CLI in Docker mode...${NC}"
else
    echo -e "${GREEN}Running Guillotine CLI...${NC}"
fi
echo "----------------------------------------"
exec "$CLI_BINARY" "$@"