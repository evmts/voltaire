# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 1
**EVMs Compared**: Guillotine Call2 (Zig with tailcall dispatch), REVM (Rust), Geth (Go), evmone (C++)
**Timestamp**: 1757044291 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Call2 | REVM | Geth | evmone |
|-----------|-----------|------|------|--------|
| erc20-approval-transfer   |   1.36 ms |   1.60 ms |   3.71 ms |   1.66 ms |
| erc20-mint                |   4.64 ms |   5.70 ms |  13.34 ms |   3.99 ms |
| erc20-transfer            |   6.85 ms |   8.32 ms |  17.19 ms |   6.13 ms |
| ten-thousand-hashes       |   2.56 ms |   3.12 ms |   9.38 ms |   2.85 ms |
| snailtracer               |  31.24 ms |  38.10 ms |  85.75 ms |  27.11 ms |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        1.36 ms |          1.36 ms |       1.36 ms |       1.36 ms |          0.00 μs |             1 |
| REVM        |        1.60 ms |          1.60 ms |       1.60 ms |       1.60 ms |          0.00 μs |             1 |
| Geth        |        3.71 ms |          3.71 ms |       3.71 ms |       3.71 ms |          0.00 μs |             1 |
| evmone      |        1.66 ms |          1.66 ms |       1.66 ms |       1.66 ms |          0.00 μs |             1 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        4.64 ms |          4.64 ms |       4.64 ms |       4.64 ms |          0.00 μs |             1 |
| REVM        |        5.70 ms |          5.70 ms |       5.70 ms |       5.70 ms |          0.00 μs |             1 |
| Geth        |       13.34 ms |         13.34 ms |      13.34 ms |      13.34 ms |          0.00 μs |             1 |
| evmone      |        3.99 ms |          3.99 ms |       3.99 ms |       3.99 ms |          0.00 μs |             1 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        6.85 ms |          6.85 ms |       6.85 ms |       6.85 ms |          0.00 μs |             1 |
| REVM        |        8.32 ms |          8.32 ms |       8.32 ms |       8.32 ms |          0.00 μs |             1 |
| Geth        |       17.19 ms |         17.19 ms |      17.19 ms |      17.19 ms |          0.00 μs |             1 |
| evmone      |        6.13 ms |          6.13 ms |       6.13 ms |       6.13 ms |          0.00 μs |             1 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        2.56 ms |          2.56 ms |       2.56 ms |       2.56 ms |          0.00 μs |             1 |
| REVM        |        3.12 ms |          3.12 ms |       3.12 ms |       3.12 ms |          0.00 μs |             1 |
| Geth        |        9.38 ms |          9.38 ms |       9.38 ms |       9.38 ms |          0.00 μs |             1 |
| evmone      |        2.85 ms |          2.85 ms |       2.85 ms |       2.85 ms |          0.00 μs |             1 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |       31.24 ms |         31.24 ms |      31.24 ms |      31.24 ms |          0.00 μs |             1 |
| REVM        |       38.10 ms |         38.10 ms |      38.10 ms |      38.10 ms |          0.00 μs |             1 |
| Geth        |       85.75 ms |         85.75 ms |      85.75 ms |      85.75 ms |          0.00 μs |             1 |
| evmone      |       27.11 ms |         27.11 ms |      27.11 ms |      27.11 ms |          0.00 μs |             1 |


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
