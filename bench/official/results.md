# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 1
**EVMs Compared**: Guillotine Call2 (Zig with tailcall dispatch), REVM (Rust), Geth (Go), evmone (C++)
**Timestamp**: 1757030699 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Call2 | REVM | Geth | evmone |
|-----------|-----------|------|------|--------|
| erc20-approval-transfer   |   1.93 ms |   1.81 ms |   3.05 ms |   1.72 ms |
| erc20-mint                |   4.80 ms |   6.00 ms |  14.91 ms |   4.56 ms |
| erc20-transfer            |   7.14 ms |   8.79 ms |  18.79 ms |   6.11 ms |
| ten-thousand-hashes       |   2.77 ms |   3.37 ms |  10.40 ms |   3.17 ms |
| snailtracer               |  56.55 ms |  39.34 ms |  87.94 ms |  26.80 ms |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        1.93 ms |          1.93 ms |       1.93 ms |       1.93 ms |          0.00 μs |             1 |
| REVM        |        1.81 ms |          1.81 ms |       1.81 ms |       1.81 ms |          0.00 μs |             1 |
| Geth        |        3.05 ms |          3.05 ms |       3.05 ms |       3.05 ms |          0.00 μs |             1 |
| evmone      |        1.72 ms |          1.72 ms |       1.72 ms |       1.72 ms |          0.00 μs |             1 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        4.80 ms |          4.80 ms |       4.80 ms |       4.80 ms |          0.00 μs |             1 |
| REVM        |        6.00 ms |          6.00 ms |       6.00 ms |       6.00 ms |          0.00 μs |             1 |
| Geth        |       14.91 ms |         14.91 ms |      14.91 ms |      14.91 ms |          0.00 μs |             1 |
| evmone      |        4.56 ms |          4.56 ms |       4.56 ms |       4.56 ms |          0.00 μs |             1 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        7.14 ms |          7.14 ms |       7.14 ms |       7.14 ms |          0.00 μs |             1 |
| REVM        |        8.79 ms |          8.79 ms |       8.79 ms |       8.79 ms |          0.00 μs |             1 |
| Geth        |       18.79 ms |         18.79 ms |      18.79 ms |      18.79 ms |          0.00 μs |             1 |
| evmone      |        6.11 ms |          6.11 ms |       6.11 ms |       6.11 ms |          0.00 μs |             1 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        2.77 ms |          2.77 ms |       2.77 ms |       2.77 ms |          0.00 μs |             1 |
| REVM        |        3.37 ms |          3.37 ms |       3.37 ms |       3.37 ms |          0.00 μs |             1 |
| Geth        |       10.40 ms |         10.40 ms |      10.40 ms |      10.40 ms |          0.00 μs |             1 |
| evmone      |        3.17 ms |          3.17 ms |       3.17 ms |       3.17 ms |          0.00 μs |             1 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |       56.55 ms |         56.55 ms |      56.55 ms |      56.55 ms |          0.00 μs |             1 |
| REVM        |       39.34 ms |         39.34 ms |      39.34 ms |      39.34 ms |          0.00 μs |             1 |
| Geth        |       87.94 ms |         87.94 ms |      87.94 ms |      87.94 ms |          0.00 μs |             1 |
| evmone      |       26.80 ms |         26.80 ms |      26.80 ms |      26.80 ms |          0.00 μs |             1 |


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
