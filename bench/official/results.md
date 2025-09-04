# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 1
**EVMs Compared**: Guillotine Call2 (Zig with tailcall dispatch), REVM (Rust), Geth (Go), evmone (C++)
**Timestamp**: 1756951203 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Call2 | REVM | Geth | evmone |
|-----------|-----------|------|------|--------|
| erc20-approval-transfer   |   1.27 ms |   1.22 ms |   3.14 ms |   1.18 ms |
| erc20-mint                |   4.36 ms |   4.80 ms |  10.84 ms |   3.42 ms |
| erc20-transfer            |   6.19 ms |   7.16 ms |  15.89 ms |   5.52 ms |
| ten-thousand-hashes       |   2.68 ms |   2.68 ms |   8.14 ms |   2.05 ms |
| snailtracer               |  56.06 ms |  32.08 ms |  72.86 ms |  22.53 ms |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        1.27 ms |          1.27 ms |       1.27 ms |       1.27 ms |          0.00 μs |             1 |
| REVM        |        1.22 ms |          1.22 ms |       1.22 ms |       1.22 ms |          0.00 μs |             1 |
| Geth        |        3.14 ms |          3.14 ms |       3.14 ms |       3.14 ms |          0.00 μs |             1 |
| evmone      |        1.18 ms |          1.18 ms |       1.18 ms |       1.18 ms |          0.00 μs |             1 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        4.36 ms |          4.36 ms |       4.36 ms |       4.36 ms |          0.00 μs |             1 |
| REVM        |        4.80 ms |          4.80 ms |       4.80 ms |       4.80 ms |          0.00 μs |             1 |
| Geth        |       10.84 ms |         10.84 ms |      10.84 ms |      10.84 ms |          0.00 μs |             1 |
| evmone      |        3.42 ms |          3.42 ms |       3.42 ms |       3.42 ms |          0.00 μs |             1 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        6.19 ms |          6.19 ms |       6.19 ms |       6.19 ms |          0.00 μs |             1 |
| REVM        |        7.16 ms |          7.16 ms |       7.16 ms |       7.16 ms |          0.00 μs |             1 |
| Geth        |       15.89 ms |         15.89 ms |      15.89 ms |      15.89 ms |          0.00 μs |             1 |
| evmone      |        5.52 ms |          5.52 ms |       5.52 ms |       5.52 ms |          0.00 μs |             1 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        2.68 ms |          2.68 ms |       2.68 ms |       2.68 ms |          0.00 μs |             1 |
| REVM        |        2.68 ms |          2.68 ms |       2.68 ms |       2.68 ms |          0.00 μs |             1 |
| Geth        |        8.14 ms |          8.14 ms |       8.14 ms |       8.14 ms |          0.00 μs |             1 |
| evmone      |        2.05 ms |          2.05 ms |       2.05 ms |       2.05 ms |          0.00 μs |             1 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |       56.06 ms |         56.06 ms |      56.06 ms |      56.06 ms |          0.00 μs |             1 |
| REVM        |       32.08 ms |         32.08 ms |      32.08 ms |      32.08 ms |          0.00 μs |             1 |
| Geth        |       72.86 ms |         72.86 ms |      72.86 ms |      72.86 ms |          0.00 μs |             1 |
| evmone      |       22.53 ms |         22.53 ms |      22.53 ms |      22.53 ms |          0.00 μs |             1 |


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
