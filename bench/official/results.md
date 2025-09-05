# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 1
**EVMs Compared**: Guillotine Call2 (Zig with tailcall dispatch), REVM (Rust), Geth (Go), evmone (C++)
**Timestamp**: 1757111972 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Call2 | REVM | Geth | evmone |
|-----------|-----------|------|------|--------|
| erc20-approval-transfer   |   1.69 ms |   1.54 ms |   3.55 ms |   1.85 ms |
| erc20-mint                |   4.54 ms |   5.64 ms |  13.09 ms |   4.29 ms |
| erc20-transfer            |   6.42 ms |   8.08 ms |  17.20 ms |   6.02 ms |
| ten-thousand-hashes       |   2.30 ms |   3.28 ms |   9.17 ms |   3.01 ms |
| snailtracer               |  25.89 ms |  37.95 ms |  86.02 ms |  27.39 ms |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |        3.55 ms |          3.55 ms |       3.55 ms |       3.55 ms |          0.00 μs |             1 |
| evmone      |        1.85 ms |          1.85 ms |       1.85 ms |       1.85 ms |          0.00 μs |             1 |
| REVM        |        1.54 ms |          1.54 ms |       1.54 ms |       1.54 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        1.69 ms |          1.69 ms |       1.69 ms |       1.69 ms |          0.00 μs |             1 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       13.09 ms |         13.09 ms |      13.09 ms |      13.09 ms |          0.00 μs |             1 |
| evmone      |        4.29 ms |          4.29 ms |       4.29 ms |       4.29 ms |          0.00 μs |             1 |
| REVM        |        5.64 ms |          5.64 ms |       5.64 ms |       5.64 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        4.54 ms |          4.54 ms |       4.54 ms |       4.54 ms |          0.00 μs |             1 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       17.20 ms |         17.20 ms |      17.20 ms |      17.20 ms |          0.00 μs |             1 |
| evmone      |        6.02 ms |          6.02 ms |       6.02 ms |       6.02 ms |          0.00 μs |             1 |
| REVM        |        8.08 ms |          8.08 ms |       8.08 ms |       8.08 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        6.42 ms |          6.42 ms |       6.42 ms |       6.42 ms |          0.00 μs |             1 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |        9.17 ms |          9.17 ms |       9.17 ms |       9.17 ms |          0.00 μs |             1 |
| evmone      |        3.01 ms |          3.01 ms |       3.01 ms |       3.01 ms |          0.00 μs |             1 |
| REVM        |        3.28 ms |          3.28 ms |       3.28 ms |       3.28 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        2.30 ms |          2.30 ms |       2.30 ms |       2.30 ms |          0.00 μs |             1 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       86.02 ms |         86.02 ms |      86.02 ms |      86.02 ms |          0.00 μs |             1 |
| evmone      |       27.39 ms |         27.39 ms |      27.39 ms |      27.39 ms |          0.00 μs |             1 |
| REVM        |       37.95 ms |         37.95 ms |      37.95 ms |      37.95 ms |          0.00 μs |             1 |
| Guillotine (Call2) |       25.89 ms |         25.89 ms |      25.89 ms |      25.89 ms |          0.00 μs |             1 |


## Notes

- **All times are normalized per individual execution run**
- Times are displayed in the most appropriate unit (μs, ms, or s)
- All implementations use optimized builds:
  - Zig (Call2): ReleaseFast with tailcall-based interpreter
  - Rust (REVM): --release
  - Go (geth): -O3 optimizations
  - C++ (evmone): -O3 -march=native
- Lower values indicate better performance
- Each hyperfine run executes the contract multiple times internally (see Internal Runs column)
- These benchmarks measure the full execution time including contract deployment

---

*Generated by Guillotine Benchmark Orchestrator*
