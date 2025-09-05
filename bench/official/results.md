# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 1
**EVMs Compared**: Guillotine Call2 (Zig with tailcall dispatch), REVM (Rust), Geth (Go), evmone (C++)
**Timestamp**: 1757034648 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Call2 | REVM | Geth | evmone |
|-----------|-----------|------|------|--------|
| erc20-approval-transfer   |   1.53 ms |   1.53 ms |   3.69 ms |   1.56 ms |
| erc20-mint                |   4.59 ms |   5.83 ms |  12.70 ms |   4.16 ms |
| erc20-transfer            |   7.03 ms |   8.19 ms |  16.92 ms |   6.48 ms |
| ten-thousand-hashes       |   2.61 ms |   3.17 ms |   9.10 ms |   3.01 ms |
| snailtracer               |  36.02 ms |  38.06 ms |  86.76 ms |  27.30 ms |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        1.53 ms |          1.53 ms |       1.53 ms |       1.53 ms |          0.00 μs |             1 |
| REVM        |        1.53 ms |          1.53 ms |       1.53 ms |       1.53 ms |          0.00 μs |             1 |
| Geth        |        3.69 ms |          3.69 ms |       3.69 ms |       3.69 ms |          0.00 μs |             1 |
| evmone      |        1.56 ms |          1.56 ms |       1.56 ms |       1.56 ms |          0.00 μs |             1 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        4.59 ms |          4.59 ms |       4.59 ms |       4.59 ms |          0.00 μs |             1 |
| REVM        |        5.83 ms |          5.83 ms |       5.83 ms |       5.83 ms |          0.00 μs |             1 |
| Geth        |       12.70 ms |         12.70 ms |      12.70 ms |      12.70 ms |          0.00 μs |             1 |
| evmone      |        4.16 ms |          4.16 ms |       4.16 ms |       4.16 ms |          0.00 μs |             1 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        7.03 ms |          7.03 ms |       7.03 ms |       7.03 ms |          0.00 μs |             1 |
| REVM        |        8.19 ms |          8.19 ms |       8.19 ms |       8.19 ms |          0.00 μs |             1 |
| Geth        |       16.92 ms |         16.92 ms |      16.92 ms |      16.92 ms |          0.00 μs |             1 |
| evmone      |        6.48 ms |          6.48 ms |       6.48 ms |       6.48 ms |          0.00 μs |             1 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        2.61 ms |          2.61 ms |       2.61 ms |       2.61 ms |          0.00 μs |             1 |
| REVM        |        3.17 ms |          3.17 ms |       3.17 ms |       3.17 ms |          0.00 μs |             1 |
| Geth        |        9.10 ms |          9.10 ms |       9.10 ms |       9.10 ms |          0.00 μs |             1 |
| evmone      |        3.01 ms |          3.01 ms |       3.01 ms |       3.01 ms |          0.00 μs |             1 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |       36.02 ms |         36.02 ms |      36.02 ms |      36.02 ms |          0.00 μs |             1 |
| REVM        |       38.06 ms |         38.06 ms |      38.06 ms |      38.06 ms |          0.00 μs |             1 |
| Geth        |       86.76 ms |         86.76 ms |      86.76 ms |      86.76 ms |          0.00 μs |             1 |
| evmone      |       27.30 ms |         27.30 ms |      27.30 ms |      27.30 ms |          0.00 μs |             1 |


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
