#!/bin/bash
set -e

# Install dependencies if needed
install_deps() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if ! command -v perf &> /dev/null; then
            echo "Installing perf tools..."
            sudo apt-get update
            sudo apt-get install -y linux-tools-common linux-tools-generic linux-tools-$(uname -r)
        fi
    fi
    
    if ! command -v flamegraph &> /dev/null; then
        echo "Installing flamegraph tool..."
        cargo install flamegraph
    fi
}

# Run profiling
profile_benchmark() {
    local benchmark="$1"
    local output_name="${2:-$benchmark}"
    
    echo "Building optimized benchmark binary with debug symbols..."
    zig build -Doptimize=ReleaseFast
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Running perf profiling on Linux..."
        sudo perf record -F 997 -g --call-graph dwarf \
            -o "perf-$output_name.data" \
            ./zig-out/bin/guillotine-bench --profile "$benchmark"
        
        echo "Generating flamegraph..."
        flamegraph --perfdata "perf-$output_name.data" \
            -o "flamegraph-$output_name.svg"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Running profiling on macOS..."
        flamegraph -o "flamegraph-$output_name.svg" \
            -- ./zig-out/bin/guillotine-bench --profile "$benchmark"
    fi
    
    echo "Flamegraph saved to: flamegraph-$output_name.svg"
}

# Main
install_deps
profile_benchmark "${1:-all}"