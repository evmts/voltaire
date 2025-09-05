# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 1
**EVMs Compared**: Guillotine Call2 (Zig with tailcall dispatch), REVM (Rust), Geth (Go), evmone (C++)
**Timestamp**: 1757049942 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Call2 | REVM | Geth | evmone |
|-----------|-----------|------|------|--------|
| erc20-approval-transfer   |   1.41 ms |   1.58 ms |   4.12 ms |   1.56 ms |
| erc20-mint                |   4.46 ms |   5.68 ms |  12.98 ms |   3.95 ms |
| erc20-transfer            |   6.55 ms |   8.32 ms |  17.43 ms |   6.07 ms |
| ten-thousand-hashes       |   2.55 ms |   3.29 ms |   9.12 ms |   2.79 ms |
| snailtracer               |  27.27 ms |  39.21 ms |  85.40 ms |  27.37 ms |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |        4.12 ms |          4.12 ms |       4.12 ms |       4.12 ms |          0.00 μs |             1 |
| evmone      |        1.56 ms |          1.56 ms |       1.56 ms |       1.56 ms |          0.00 μs |             1 |
| REVM        |        1.58 ms |          1.58 ms |       1.58 ms |       1.58 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        1.41 ms |          1.41 ms |       1.41 ms |       1.41 ms |          0.00 μs |             1 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       12.98 ms |         12.98 ms |      12.98 ms |      12.98 ms |          0.00 μs |             1 |
| evmone      |        3.95 ms |          3.95 ms |       3.95 ms |       3.95 ms |          0.00 μs |             1 |
| REVM        |        5.68 ms |          5.68 ms |       5.68 ms |       5.68 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        4.46 ms |          4.46 ms |       4.46 ms |       4.46 ms |          0.00 μs |             1 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       17.43 ms |         17.43 ms |      17.43 ms |      17.43 ms |          0.00 μs |             1 |
| evmone      |        6.07 ms |          6.07 ms |       6.07 ms |       6.07 ms |          0.00 μs |             1 |
| REVM        |        8.32 ms |          8.32 ms |       8.32 ms |       8.32 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        6.55 ms |          6.55 ms |       6.55 ms |       6.55 ms |          0.00 μs |             1 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |        9.12 ms |          9.12 ms |       9.12 ms |       9.12 ms |          0.00 μs |             1 |
| evmone      |        2.79 ms |          2.79 ms |       2.79 ms |       2.79 ms |          0.00 μs |             1 |
| REVM        |        3.29 ms |          3.29 ms |       3.29 ms |       3.29 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        2.55 ms |          2.55 ms |       2.55 ms |       2.55 ms |          0.00 μs |             1 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       85.40 ms |         85.40 ms |      85.40 ms |      85.40 ms |          0.00 μs |             1 |
| evmone      |       27.37 ms |         27.37 ms |      27.37 ms |      27.37 ms |          0.00 μs |             1 |
| REVM        |       39.21 ms |         39.21 ms |      39.21 ms |      39.21 ms |          0.00 μs |             1 |
| Guillotine (Call2) |       27.27 ms |         27.27 ms |      27.27 ms |      27.27 ms |          0.00 μs |             1 |


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
