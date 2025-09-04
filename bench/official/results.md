# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 1
**EVMs Compared**: Guillotine Call2 (Zig with tailcall dispatch), REVM (Rust), Geth (Go), evmone (C++)
**Timestamp**: 1757010149 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Call2 | REVM | Geth | evmone |
|-----------|-----------|------|------|--------|
| erc20-approval-transfer   |   1.47 ms |   1.44 ms |   3.77 ms |   1.65 ms |
| erc20-mint                |   4.64 ms |   5.93 ms |  13.19 ms |   4.26 ms |
| erc20-transfer            |   7.43 ms |   8.17 ms |  18.03 ms |   6.34 ms |
| ten-thousand-hashes       |   2.85 ms |   3.31 ms |   9.46 ms |   2.84 ms |
| snailtracer               |  57.78 ms |  38.74 ms |  86.33 ms |  26.83 ms |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        1.47 ms |          1.47 ms |       1.47 ms |       1.47 ms |          0.00 μs |             1 |
| REVM        |        1.44 ms |          1.44 ms |       1.44 ms |       1.44 ms |          0.00 μs |             1 |
| Geth        |        3.77 ms |          3.77 ms |       3.77 ms |       3.77 ms |          0.00 μs |             1 |
| evmone      |        1.65 ms |          1.65 ms |       1.65 ms |       1.65 ms |          0.00 μs |             1 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        4.64 ms |          4.64 ms |       4.64 ms |       4.64 ms |          0.00 μs |             1 |
| REVM        |        5.93 ms |          5.93 ms |       5.93 ms |       5.93 ms |          0.00 μs |             1 |
| Geth        |       13.19 ms |         13.19 ms |      13.19 ms |      13.19 ms |          0.00 μs |             1 |
| evmone      |        4.26 ms |          4.26 ms |       4.26 ms |       4.26 ms |          0.00 μs |             1 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        7.43 ms |          7.43 ms |       7.43 ms |       7.43 ms |          0.00 μs |             1 |
| REVM        |        8.17 ms |          8.17 ms |       8.17 ms |       8.17 ms |          0.00 μs |             1 |
| Geth        |       18.03 ms |         18.03 ms |      18.03 ms |      18.03 ms |          0.00 μs |             1 |
| evmone      |        6.34 ms |          6.34 ms |       6.34 ms |       6.34 ms |          0.00 μs |             1 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |        2.85 ms |          2.85 ms |       2.85 ms |       2.85 ms |          0.00 μs |             1 |
| REVM        |        3.31 ms |          3.31 ms |       3.31 ms |       3.31 ms |          0.00 μs |             1 |
| Geth        |        9.46 ms |          9.46 ms |       9.46 ms |       9.46 ms |          0.00 μs |             1 |
| evmone      |        2.84 ms |          2.84 ms |       2.84 ms |       2.84 ms |          0.00 μs |             1 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |       57.78 ms |         57.78 ms |      57.78 ms |      57.78 ms |          0.00 μs |             1 |
| REVM        |       38.74 ms |         38.74 ms |      38.74 ms |      38.74 ms |          0.00 μs |             1 |
| Geth        |       86.33 ms |         86.33 ms |      86.33 ms |      86.33 ms |          0.00 μs |             1 |
| evmone      |       26.83 ms |         26.83 ms |      26.83 ms |      26.83 ms |          0.00 μs |             1 |


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
