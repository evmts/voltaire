# Hyperfine Benchmark Example

This is a simple Rust hello world program set up for benchmarking with hyperfine.

## Prerequisites

Install hyperfine:
```bash
# Using cargo
cargo install hyperfine

# Or using your system package manager
# macOS: brew install hyperfine
# Ubuntu/Debian: apt install hyperfine
# Arch: pacman -S hyperfine
```

## Running Benchmarks

Execute the benchmark script:
```bash
./benchmark.sh
```

This will:
1. Build the Rust program in release mode
2. Run a basic benchmark
3. Run a more thorough benchmark with 50 runs
4. Compare debug vs release builds
5. Export results to `results.md` and `results.json`

## Manual Benchmarking

You can also run hyperfine manually:
```bash
# Build first
cargo build --release

# Simple benchmark
hyperfine './target/release/hyperfine-bench'

# With custom options
hyperfine --runs 100 --warmup 5 './target/release/hyperfine-bench'
```