# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 1
**EVMs Compared**: Guillotine Call2 (Zig with tailcall dispatch), REVM (Rust), Geth (Go), evmone (C++)
**Timestamp**: 1756869506 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Call2 | REVM | Geth | evmone |
|-----------|-----------|------|------|--------|
| erc20-approval-transfer   |   1.78 ms |   7.29 ms |  14.95 ms |   5.76 ms |
| erc20-mint                |   1.64 ms |   5.91 ms |  14.00 ms |   4.17 ms |
| erc20-transfer            |   1.87 ms |   9.08 ms |  18.87 ms |   6.31 ms |
| ten-thousand-hashes       |   1.56 ms |   3.22 ms |   9.83 ms |   3.15 ms |
| snailtracer               |   2.47 ms |  38.60 ms |  87.81 ms |  28.24 ms |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        1.78 ms |          1.78 ms |       1.78 ms |       1.78 ms |          0.00 μs |             1 |
| REVM        |        7.29 ms |          7.29 ms |       7.29 ms |       7.29 ms |          0.00 μs |             1 |
| Geth        |       14.95 ms |         14.95 ms |      14.95 ms |      14.95 ms |          0.00 μs |             1 |
| evmone      |        5.76 ms |          5.76 ms |       5.76 ms |       5.76 ms |          0.00 μs |             1 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        1.64 ms |          1.64 ms |       1.64 ms |       1.64 ms |          0.00 μs |             1 |
| REVM        |        5.91 ms |          5.91 ms |       5.91 ms |       5.91 ms |          0.00 μs |             1 |
| Geth        |       14.00 ms |         14.00 ms |      14.00 ms |      14.00 ms |          0.00 μs |             1 |
| evmone      |        4.17 ms |          4.17 ms |       4.17 ms |       4.17 ms |          0.00 μs |             1 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        1.87 ms |          1.87 ms |       1.87 ms |       1.87 ms |          0.00 μs |             1 |
| REVM        |        9.08 ms |          9.08 ms |       9.08 ms |       9.08 ms |          0.00 μs |             1 |
| Geth        |       18.87 ms |         18.87 ms |      18.87 ms |      18.87 ms |          0.00 μs |             1 |
| evmone      |        6.31 ms |          6.31 ms |       6.31 ms |       6.31 ms |          0.00 μs |             1 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        1.56 ms |          1.56 ms |       1.56 ms |       1.56 ms |          0.00 μs |             1 |
| REVM        |        3.22 ms |          3.22 ms |       3.22 ms |       3.22 ms |          0.00 μs |             1 |
| Geth        |        9.83 ms |          9.83 ms |       9.83 ms |       9.83 ms |          0.00 μs |             1 |
| evmone      |        3.15 ms |          3.15 ms |       3.15 ms |       3.15 ms |          0.00 μs |             1 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        2.47 ms |          2.47 ms |       2.47 ms |       2.47 ms |          0.00 μs |             1 |
| REVM        |       38.60 ms |         38.60 ms |      38.60 ms |      38.60 ms |          0.00 μs |             1 |
| Geth        |       87.81 ms |         87.81 ms |      87.81 ms |      87.81 ms |          0.00 μs |             1 |
| evmone      |       28.24 ms |         28.24 ms |      28.24 ms |      28.24 ms |          0.00 μs |             1 |


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
