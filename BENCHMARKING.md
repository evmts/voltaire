# Benchmarking Guide

This document provides comprehensive instructions for running and interpreting performance benchmarks in the Ethereum Primitives library.

## Overview

The project includes two types of benchmarks:

1. **Native Zig Benchmarks** - Measure performance of Zig implementations using [zbench](https://github.com/hendriknielaender/zbench)
2. **TypeScript Comparison Benchmarks** - Compare TypeScript/FFI implementations against popular libraries (ethers.js, viem, ethereum-cryptography)

## Running Zig Benchmarks

### Quick Start

Benchmarks are **opt-in** to keep the default build fast. Enable them with the `-Dwith-benches=true` flag:

```bash
# Build and run all benchmarks
zig build -Dwith-benches=true bench

# This will:
# 1. Build the project with benchmarks enabled
# 2. Compile ~10 benchmark executables
# 3. Run all benchmarks sequentially
```

###Filter Specific Benchmarks

You can filter benchmarks by pattern to run only specific categories:

```bash
# Numeric operations (uint256, hex conversions, etc.)
zig build -Dwith-benches=true bench --filter numeric

# EIP-712 typed data signing
zig build -Dwith-benches=true bench --filter eip712

# All primitives benchmarks (address, RLP, bytecode, etc.)
zig build -Dwith-benches=true bench --filter primitives

# All crypto benchmarks (keccak256, secp256k1, etc.)
zig build -Dwith-benches=true bench --filter crypto

# All precompile benchmarks (ecrecover, SHA256, BN254, etc.)
zig build -Dwith-benches=true bench --filter precompiles
```

### Run Individual Benchmark Binaries

For more detailed output, run the compiled benchmark binaries directly:

```bash
# List all benchmark binaries
ls zig-out/bin/zbench-*

# Run specific benchmarks
./zig-out/bin/zbench-rlp
./zig-out/bin/zbench-hash
./zig-out/bin/zbench-address
./zig-out/bin/zbench-keccak
./zig-out/bin/zbench-eip712
```

## Why Are Benchmarks Gated?

Benchmarks are behind a build flag (`-Dwith-benches=true`) for several reasons:

- **Faster default builds** - Avoids compiling ~10 additional executables during regular development
- **Reduced dependencies** - zbench is only fetched when benchmarks are requested
- **Performance focus** - Benchmarks are primarily useful for performance testing and optimization
- **Clean output** - `zig build` remains fast and quiet for everyday use

## What Gets Benchmarked

Benchmarks are co-located with source code in `src/**/*.bench.zig` files:

### Primitives
- **Numeric operations**: uint256 arithmetic, conversions
- **Hex encoding/decoding**: bytesToHex, hexToBytes
- **RLP encoding/decoding**: Single values, lists, nested structures
- **Address operations**: fromHex, toChecksumHex, CREATE/CREATE2 calculations

### Crypto
- **Keccak-256 hashing**: Various input sizes (32B, 256B, 1KB, 10KB)
- **secp256k1 signatures**: Sign, verify, recover operations
- **EIP-712 typed data**: Hash and sign structured data

### Precompiles
- **ecrecover (0x01)**: Signature recovery
- **SHA-256 (0x02)**: Standard hashing
- **BN254 operations (0x06-0x08)**: Elliptic curve operations
- **BLS12-381 operations (0x0B-0x13)**: G1/G2 operations, pairings

## Expected Output

### Zbench Configuration

Benchmarks use zbench's default configuration:
- **Warmup iterations**: Automatic (warms up CPU caches before measurement)
- **Measurement iterations**: Adaptive based on operation speed
- **Output format**: Operations per second, mean time, standard deviation

### Sample Output

When running benchmarks directly, you'll see output like:

```
Benchmark: keccak256_32_bytes
  Iterations: 1,000,000
  Mean: 245 ns
  Std Dev: 12 ns
  Throughput: 4,081,633 ops/sec

Benchmark: keccak256_1KB
  Iterations: 100,000
  Mean: 3,421 ns
  Std Dev: 145 ns
  Throughput: 292,305 ops/sec
```

### macOS Note

**Important**: Benchmarks produce minimal output on macOS by default when run via `zig build bench`. This is a zbench behavior. For detailed results:

1. Run individual benchmark binaries: `./zig-out/bin/zbench-keccak`
2. Or redirect output: `zig build -Dwith-benches=true bench 2>&1 | tee benchmark-results.txt`
3. Or check [ZIG_BENCHMARK_RESULTS.md](./ZIG_BENCHMARK_RESULTS.md) for documented results

## Running TypeScript Comparison Benchmarks

Compare TypeScript/FFI implementations against popular Ethereum libraries:

```bash
# Run all comparison benchmarks
bun run vitest bench comparisons/

# Run specific category
bun run vitest bench comparisons/keccak256/
bun run vitest bench comparisons/abi/
bun run vitest bench comparisons/address/
bun run vitest bench comparisons/hex/
```

### Compared Libraries

Benchmarks compare @tevm/primitives against:
- **ethers.js** - Most popular Ethereum library
- **viem** - Modern, performant Ethereum library
- **ethereum-cryptography** - Focused cryptography library
- **@noble/hashes** - Pure JavaScript crypto primitives

### TypeScript Benchmark Output

```bash
$ bun run vitest bench comparisons/keccak256/

 ✓ keccak256 comparisons
   name                           hz       min       max      mean       p75       p99      p995      p999     rme  samples
 · @tevm/primitives (FFI)    127,431  0.0065    0.8642    0.0078    0.0077    0.0156    0.0247    0.0842  ±2.14%    63716
 · @noble/hashes              52,341  0.0174    1.2341    0.0191    0.0185    0.0341    0.0521    0.1234  ±3.21%    26171
 · ethers.js                  48,123  0.0189    1.4521    0.0208    0.0201    0.0389    0.0612    0.1456  ±3.45%    24062
```

## Interpreting Results

### Performance Metrics

- **Operations/sec (hz)**: Higher is better - how many times the operation can execute per second
- **Mean time**: Average execution time - lower is better
- **Standard deviation**: Consistency of performance - lower is better
- **p99/p995/p999**: Tail latency - shows worst-case performance

### Expected Performance Ranges

Based on benchmarks run on Apple M1 Pro (16GB RAM):

| Operation | Native Zig | TypeScript (Pure) | TypeScript (FFI) |
|-----------|------------|-------------------|------------------|
| keccak256 (32B) | ~4M ops/sec | ~50K ops/sec | ~130K ops/sec |
| RLP encode | ~2M ops/sec | ~200K ops/sec | ~500K ops/sec |
| Address checksum | ~1M ops/sec | ~80K ops/sec | ~300K ops/sec |
| secp256k1 sign | ~20K ops/sec | ~5K ops/sec | ~15K ops/sec |

### Performance Comparison Guidelines

- **Native Zig**: Fastest, used internally by the library
- **TypeScript FFI**: 2-3x slower than native, excellent for Bun users
- **Pure TypeScript**: 10-20x slower than native, portable everywhere

## Benchmark File Locations

```
primitives/
├── src/
│   ├── primitives/
│   │   ├── address.bench.zig
│   │   ├── hex.bench.zig
│   │   ├── rlp.bench.zig
│   │   └── numeric.bench.zig
│   ├── crypto/
│   │   ├── keccak.bench.zig
│   │   ├── secp256k1.bench.zig
│   │   └── eip712.bench.zig
│   └── precompiles/
│       ├── ecrecover.bench.zig
│       ├── sha256.bench.zig
│       └── bn254.bench.zig
└── comparisons/
    ├── keccak256/
    ├── abi/
    ├── address/
    └── hex/
```

## Adding New Benchmarks

### Zig Benchmarks

Create a `.bench.zig` file next to the code you want to benchmark:

```zig
const std = @import("std");
const zbench = @import("zbench");

fn benchmarkMyFunction(allocator: std.mem.Allocator) void {
    const result = myFunction(allocator, input);
    std.mem.doNotOptimizeAway(result);
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var bench = zbench.Benchmark.init(allocator, .{});
    defer bench.deinit();

    try bench.add("My Function", benchmarkMyFunction, .{});
    try bench.run(std.io.getStdOut().writer());
}
```

### TypeScript Benchmarks

Add to the appropriate `comparisons/` directory:

```typescript
import { bench, describe } from 'vitest';
import { myFunction as tevmMyFunction } from '@tevm/primitives';
import { myFunction as ethersMyFunction } from 'ethers';

describe('myFunction comparison', () => {
  const input = '0x1234...';

  bench('@tevm/primitives', () => {
    tevmMyFunction(input);
  });

  bench('ethers.js', () => {
    ethersMyFunction(input);
  });
});
```

## Results Documentation

For documented benchmark results from actual runs:

- **[ZIG_BENCHMARK_RESULTS.md](./ZIG_BENCHMARK_RESULTS.md)** - Comprehensive Zig performance data
- **[BENCHMARK_RESULTS.md](./BENCHMARK_RESULTS.md)** - TypeScript/FFI comparison data

## Continuous Benchmarking

### CI Integration

To run benchmarks in CI:

```yaml
- name: Run Zig Benchmarks
  run: |
    zig build -Dwith-benches=true bench > benchmark-results.txt
    cat benchmark-results.txt

- name: Run TypeScript Benchmarks
  run: |
    bun install
    bun run vitest bench --reporter=verbose
```

### Regression Detection

Compare results over time:

```bash
# Save baseline
zig build -Dwith-benches=true bench > baseline.txt

# After changes
zig build -Dwith-benches=true bench > current.txt

# Compare (manual or automated)
diff baseline.txt current.txt
```

## Performance Optimization Tips

When benchmarking your own code:

1. **Run multiple times** - Benchmark results can vary, run 3-5 times and average
2. **Close other applications** - Reduce system noise during benchmarking
3. **Use release builds** - Always benchmark with `zig build -Doptimize=ReleaseFast`
4. **Warm up first** - zbench handles this, but for manual benchmarks, warm up CPU caches
5. **Test realistic workloads** - Benchmark with actual use-case data sizes
6. **Profile before optimizing** - Use `perf` or `Instruments` to find hotspots

## Troubleshooting

### "Cannot find zbench"

Ensure benchmarks are enabled:
```bash
zig build -Dwith-benches=true bench
```

### "No output on macOS"

Run individual binaries:
```bash
./zig-out/bin/zbench-keccak
```

### "Build takes too long"

Benchmarks add ~10 executables. For regular development, omit the flag:
```bash
zig build  # Fast, no benchmarks
```

### "Results are inconsistent"

- Close other applications
- Run on AC power (not battery)
- Disable CPU throttling if possible
- Run multiple times and average results

## Related Documentation

- [README.md](./README.md) - Main project documentation
- [ZIG_BENCHMARK_RESULTS.md](./ZIG_BENCHMARK_RESULTS.md) - Zig performance data
- [BENCHMARK_RESULTS.md](./BENCHMARK_RESULTS.md) - TypeScript comparison data
- [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute benchmarks

---

*For questions or issues with benchmarks, please open a GitHub issue.*
