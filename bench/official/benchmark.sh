#!/bin/bash

# Build the Rust program first
echo "Building the Rust program..."
cargo build --release

# The binaries are built in the workspace root's target directory
RELEASE_BIN="../../target/release/hyperfine-bench"
DEBUG_BIN="../../target/debug/hyperfine-bench"

# Basic benchmark
echo -e "\n=== Basic Hello World Benchmark ==="
hyperfine "${RELEASE_BIN}"

# Benchmark with more runs for better statistics
echo -e "\n=== Benchmark with 50 runs ==="
hyperfine --runs 50 "${RELEASE_BIN}"

# Compare debug vs release builds
echo -e "\n=== Debug vs Release Comparison ==="
cargo build
hyperfine --warmup 3 \
  -n 'debug build' "${DEBUG_BIN}" \
  -n 'release build' "${RELEASE_BIN}"

# Export results to different formats
echo -e "\n=== Exporting Results ==="
hyperfine --runs 20 \
  --export-markdown results.md \
  --export-json results.json \
  "${RELEASE_BIN}"

echo -e "\nBenchmark complete! Results saved to results.md and results.json"