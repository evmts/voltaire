# Profiling Guillotine with Flamegraphs

## Overview

Flamegraph profiling support enables visualization of CPU time spent in different functions during benchmark execution. This helps identify performance bottlenecks and guide optimization efforts.

## Quick Start

### Linux
```bash
# Install dependencies
sudo apt-get install linux-tools-common linux-tools-generic linux-tools-$(uname -r)
cargo install flamegraph

# Run profiling
./scripts/profile.sh stack_operations

# View results
firefox flamegraph-stack_operations.svg
```

### macOS
```bash
# Install dependencies
brew install --cask xcode  # If not already installed
cargo install flamegraph

# Run profiling
./scripts/profile.sh stack_operations

# View results
open flamegraph-stack_operations.svg
```

## Available Profiling Targets

The profiling system supports the following benchmark profiles:

- `all` - Run all profiling workloads
- `stack_operations` - Profile stack push/pop/dup/swap operations
- `memory_operations` - Profile memory allocation patterns
- `precompiles` - Profile cryptographic operations
- `hardfork_checks` - Profile hardfork activation checks

## Using the Flamegraph Build Target

```bash
# Build and run with flamegraph profiling
zig build flamegraph

# The flamegraph will be saved as guillotine-bench.svg
```

## Manual Profiling

### Running benchmarks in profile mode
```bash
# Build the benchmark executable
zig build -Doptimize=ReleaseFast

# Run with profiling flag
./zig-out/bin/guillotine-bench --profile stack_operations
```

### Platform-specific commands

#### Linux (using perf)
```bash
# Record performance data
sudo perf record -F 997 -g --call-graph dwarf ./zig-out/bin/guillotine-bench --profile

# Generate flamegraph
flamegraph --perfdata perf.data -o output.svg
```

#### macOS (using flamegraph)
```bash
# Record and generate in one step
flamegraph -o output.svg -- ./zig-out/bin/guillotine-bench --profile
```

## Interpreting Flamegraphs

### Visual Elements
- **Width**: Represents the percentage of CPU time spent in a function (inclusive of children)
- **Height**: Shows the call stack depth
- **Colors**: Random assignment for visual distinction (not meaningful)

### Interactive Features
- Click on any box to zoom into that call stack
- Search for function names using Ctrl+F
- Reset zoom by clicking the root element

### Key Areas to Focus On
1. **Wide bars at the top**: Functions consuming the most CPU time
2. **Tall stacks**: Deep call chains that might benefit from optimization
3. **Repeated patterns**: Functions called frequently in loops

## Performance Tips

### Stack Operations
The stack is one of the most performance-critical components. Look for:
- `append_unsafe` and `pop_unsafe` calls in hot paths
- Unnecessary bounds checking in validated contexts
- Memory access patterns in stack manipulation

### Memory Operations
Memory management can be a bottleneck. Watch for:
- Frequent allocations/deallocations
- Memory expansion costs
- Suboptimal access patterns

### Precompiles
Cryptographic operations are inherently expensive. Consider:
- Caching results when possible
- Batch operations
- Hardware acceleration opportunities

## Comparing Performance

### Before/After Optimization
1. Generate a baseline flamegraph before changes
2. Implement optimizations
3. Generate a new flamegraph
4. Compare the two to verify improvements

### Comparing with revm
To profile revm (Rust EVM) for comparison:
```bash
# Clone revm
git clone https://github.com/bluealloy/revm
cd revm

# Run their benchmarks with flamegraph
cargo flamegraph --bench bench_name

# Compare the generated SVGs side-by-side
```

## Continuous Integration

Flamegraph generation can be triggered in CI using GitHub Actions:
```yaml
# Trigger manually from Actions tab
workflow_dispatch:
  inputs:
    benchmark:
      description: 'Benchmark to profile'
      required: true
      default: 'all'
```

## Troubleshooting

### "Permission denied" on Linux
- Ensure you have permissions for perf: `sudo sysctl kernel.perf_event_paranoid=-1`
- Or run with sudo: `sudo ./scripts/profile.sh`

### Missing symbols in flamegraph
- Ensure debug symbols are included: Build with `ReleaseFast` mode
- Check that `strip = false` is set in build configuration

### Empty or small flamegraphs
- Increase the number of iterations in the profiling workload
- Ensure the benchmark runs for at least 1-2 seconds

## Best Practices

1. **Profile Release Builds**: Always use optimized builds (`ReleaseFast`) for realistic results
2. **Sufficient Duration**: Ensure benchmarks run long enough for good sampling (>1 second)
3. **Multiple Runs**: Generate multiple flamegraphs to ensure consistency
4. **Focus Areas**: Start with the widest bars and work your way down
5. **Document Changes**: Keep notes on what optimizations were applied

## References

- [Brendan Gregg's Flamegraph](http://www.brendangregg.com/flamegraphs.html)
- [cargo-flamegraph Documentation](https://github.com/flamegraph-rs/flamegraph)
- [Zig Performance Guide](https://ziglang.org/documentation/master/#Performance-and-Safety)
- [Linux perf Tutorial](https://perf.wiki.kernel.org/index.php/Tutorial)