#!/bin/bash

# Build the Rust program first
echo "Building the Rust program..."
cargo build --release

# Basic benchmark
echo -e "\n=== Basic Hello World Benchmark ==="
hyperfine './target/release/hyperfine-bench'

# Benchmark with more runs for better statistics
echo -e "\n=== Benchmark with 50 runs ==="
hyperfine --runs 50 './target/release/hyperfine-bench'

# Compare debug vs release builds
echo -e "\n=== Debug vs Release Comparison ==="
cargo build
hyperfine --warmup 3 \
  -n 'debug build' './target/debug/hyperfine-bench' \
  -n 'release build' './target/release/hyperfine-bench'

# Export results to different formats
echo -e "\n=== Exporting Results ==="
hyperfine --runs 20 \
  --export-markdown results.md \
  --export-json results.json \
  './target/release/hyperfine-bench'

echo -e "\nBenchmark complete! Results saved to results.md and results.json"