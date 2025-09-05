# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 1
**EVMs Compared**: Guillotine Call2 (Zig with tailcall dispatch), REVM (Rust), Geth (Go), evmone (C++)
**Timestamp**: 1757113906 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Call2 | REVM | Geth | evmone |
|-----------|-----------|------|------|--------|
| erc20-approval-transfer   |   1.73 ms |   1.49 ms |   3.45 ms |   1.61 ms |
| erc20-mint                |   4.57 ms |   5.93 ms |  13.12 ms |   4.12 ms |
| erc20-transfer            |   6.54 ms |   8.41 ms |  17.65 ms |   6.55 ms |
| ten-thousand-hashes       |   2.54 ms |   3.15 ms |   9.44 ms |   2.90 ms |
| snailtracer               |  27.32 ms |  38.43 ms |  85.79 ms |  27.48 ms |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |        3.45 ms |          3.45 ms |       3.45 ms |       3.45 ms |          0.00 μs |             1 |
| evmone      |        1.61 ms |          1.61 ms |       1.61 ms |       1.61 ms |          0.00 μs |             1 |
| REVM        |        1.49 ms |          1.49 ms |       1.49 ms |       1.49 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        1.73 ms |          1.73 ms |       1.73 ms |       1.73 ms |          0.00 μs |             1 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       13.12 ms |         13.12 ms |      13.12 ms |      13.12 ms |          0.00 μs |             1 |
| evmone      |        4.12 ms |          4.12 ms |       4.12 ms |       4.12 ms |          0.00 μs |             1 |
| REVM        |        5.93 ms |          5.93 ms |       5.93 ms |       5.93 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        4.57 ms |          4.57 ms |       4.57 ms |       4.57 ms |          0.00 μs |             1 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       17.65 ms |         17.65 ms |      17.65 ms |      17.65 ms |          0.00 μs |             1 |
| evmone      |        6.55 ms |          6.55 ms |       6.55 ms |       6.55 ms |          0.00 μs |             1 |
| REVM        |        8.41 ms |          8.41 ms |       8.41 ms |       8.41 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        6.54 ms |          6.54 ms |       6.54 ms |       6.54 ms |          0.00 μs |             1 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |        9.44 ms |          9.44 ms |       9.44 ms |       9.44 ms |          0.00 μs |             1 |
| evmone      |        2.90 ms |          2.90 ms |       2.90 ms |       2.90 ms |          0.00 μs |             1 |
| REVM        |        3.15 ms |          3.15 ms |       3.15 ms |       3.15 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        2.54 ms |          2.54 ms |       2.54 ms |       2.54 ms |          0.00 μs |             1 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       85.79 ms |         85.79 ms |      85.79 ms |      85.79 ms |          0.00 μs |             1 |
| evmone      |       27.48 ms |         27.48 ms |      27.48 ms |      27.48 ms |          0.00 μs |             1 |
| REVM        |       38.43 ms |         38.43 ms |      38.43 ms |      38.43 ms |          0.00 μs |             1 |
| Guillotine (Call2) |       27.32 ms |         27.32 ms |      27.32 ms |      27.32 ms |          0.00 μs |             1 |


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
