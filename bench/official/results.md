# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 1
**EVMs Compared**: Guillotine Call2 (Zig with tailcall dispatch), REVM (Rust), Geth (Go), evmone (C++)
**Timestamp**: 1757032938 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Call2 | REVM | Geth | evmone |
|-----------|-----------|------|------|--------|
| erc20-approval-transfer   |   2.20 ms |   1.60 ms |   3.59 ms |   2.55 ms |
| erc20-mint                |   4.69 ms |   6.12 ms |  13.17 ms |   4.72 ms |
| erc20-transfer            |   7.51 ms |   8.27 ms | 118.68 ms |   6.70 ms |
| ten-thousand-hashes       |   2.70 ms |   3.24 ms |  11.34 ms |   3.27 ms |
| snailtracer               |  33.76 ms |  39.03 ms |  88.86 ms |  28.72 ms |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        2.20 ms |          2.20 ms |       2.20 ms |       2.20 ms |          0.00 μs |             1 |
| REVM        |        1.60 ms |          1.60 ms |       1.60 ms |       1.60 ms |          0.00 μs |             1 |
| Geth        |        3.59 ms |          3.59 ms |       3.59 ms |       3.59 ms |          0.00 μs |             1 |
| evmone      |        2.55 ms |          2.55 ms |       2.55 ms |       2.55 ms |          0.00 μs |             1 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        4.69 ms |          4.69 ms |       4.69 ms |       4.69 ms |          0.00 μs |             1 |
| REVM        |        6.12 ms |          6.12 ms |       6.12 ms |       6.12 ms |          0.00 μs |             1 |
| Geth        |       13.17 ms |         13.17 ms |      13.17 ms |      13.17 ms |          0.00 μs |             1 |
| evmone      |        4.72 ms |          4.72 ms |       4.72 ms |       4.72 ms |          0.00 μs |             1 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        7.51 ms |          7.51 ms |       7.51 ms |       7.51 ms |          0.00 μs |             1 |
| REVM        |        8.27 ms |          8.27 ms |       8.27 ms |       8.27 ms |          0.00 μs |             1 |
| Geth        |      118.68 ms |        118.68 ms |     118.68 ms |     118.68 ms |          0.00 μs |             1 |
| evmone      |        6.70 ms |          6.70 ms |       6.70 ms |       6.70 ms |          0.00 μs |             1 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        2.70 ms |          2.70 ms |       2.70 ms |       2.70 ms |          0.00 μs |             1 |
| REVM        |        3.24 ms |          3.24 ms |       3.24 ms |       3.24 ms |          0.00 μs |             1 |
| Geth        |       11.34 ms |         11.34 ms |      11.34 ms |      11.34 ms |          0.00 μs |             1 |
| evmone      |        3.27 ms |          3.27 ms |       3.27 ms |       3.27 ms |          0.00 μs |             1 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |       33.76 ms |         33.76 ms |      33.76 ms |      33.76 ms |          0.00 μs |             1 |
| REVM        |       39.03 ms |         39.03 ms |      39.03 ms |      39.03 ms |          0.00 μs |             1 |
| Geth        |       88.86 ms |         88.86 ms |      88.86 ms |      88.86 ms |          0.00 μs |             1 |
| evmone      |       28.72 ms |         28.72 ms |      28.72 ms |      28.72 ms |          0.00 μs |             1 |


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
