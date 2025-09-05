# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 1
**EVMs Compared**: Guillotine Call2 (Zig with tailcall dispatch), REVM (Rust), Geth (Go), evmone (C++)
**Timestamp**: 1757052587 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Call2 | REVM | Geth | evmone |
|-----------|-----------|------|------|--------|
| erc20-approval-transfer   |   1.35 ms |   2.15 ms |   4.27 ms |   2.29 ms |
| erc20-mint                |   5.98 ms |   6.11 ms |  13.92 ms |   4.86 ms |
| erc20-transfer            |   6.48 ms |   8.14 ms |  18.88 ms |   7.12 ms |
| ten-thousand-hashes       |   2.87 ms |   3.40 ms |  10.35 ms |   2.83 ms |
| snailtracer               |  28.07 ms |  39.39 ms |  84.94 ms |  28.66 ms |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |        4.27 ms |          4.27 ms |       4.27 ms |       4.27 ms |          0.00 μs |             1 |
| evmone      |        2.29 ms |          2.29 ms |       2.29 ms |       2.29 ms |          0.00 μs |             1 |
| REVM        |        2.15 ms |          2.15 ms |       2.15 ms |       2.15 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        1.35 ms |          1.35 ms |       1.35 ms |       1.35 ms |          0.00 μs |             1 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       13.92 ms |         13.92 ms |      13.92 ms |      13.92 ms |          0.00 μs |             1 |
| evmone      |        4.86 ms |          4.86 ms |       4.86 ms |       4.86 ms |          0.00 μs |             1 |
| REVM        |        6.11 ms |          6.11 ms |       6.11 ms |       6.11 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        5.98 ms |          5.98 ms |       5.98 ms |       5.98 ms |          0.00 μs |             1 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       18.88 ms |         18.88 ms |      18.88 ms |      18.88 ms |          0.00 μs |             1 |
| evmone      |        7.12 ms |          7.12 ms |       7.12 ms |       7.12 ms |          0.00 μs |             1 |
| REVM        |        8.14 ms |          8.14 ms |       8.14 ms |       8.14 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        6.48 ms |          6.48 ms |       6.48 ms |       6.48 ms |          0.00 μs |             1 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       10.35 ms |         10.35 ms |      10.35 ms |      10.35 ms |          0.00 μs |             1 |
| evmone      |        2.83 ms |          2.83 ms |       2.83 ms |       2.83 ms |          0.00 μs |             1 |
| REVM        |        3.40 ms |          3.40 ms |       3.40 ms |       3.40 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        2.87 ms |          2.87 ms |       2.87 ms |       2.87 ms |          0.00 μs |             1 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       84.94 ms |         84.94 ms |      84.94 ms |      84.94 ms |          0.00 μs |             1 |
| evmone      |       28.66 ms |         28.66 ms |      28.66 ms |      28.66 ms |          0.00 μs |             1 |
| REVM        |       39.39 ms |         39.39 ms |      39.39 ms |      39.39 ms |          0.00 μs |             1 |
| Guillotine (Call2) |       28.07 ms |         28.07 ms |      28.07 ms |      28.07 ms |          0.00 μs |             1 |


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
