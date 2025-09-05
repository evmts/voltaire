# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 1
**EVMs Compared**: Guillotine Call2 (Zig with tailcall dispatch), REVM (Rust), Geth (Go), evmone (C++)
**Timestamp**: 1757057620 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Call2 | REVM | Geth | evmone |
|-----------|-----------|------|------|--------|
| erc20-approval-transfer   |   1.97 ms |   1.69 ms |   4.72 ms |   1.74 ms |
| erc20-mint                |   4.56 ms |   5.85 ms |  12.91 ms |   3.98 ms |
| erc20-transfer            |   6.52 ms |   8.34 ms |  18.34 ms |   6.40 ms |
| ten-thousand-hashes       |   2.55 ms |   3.25 ms |   9.42 ms |   3.01 ms |
| snailtracer               |  27.73 ms |  37.72 ms |  86.55 ms |  28.43 ms |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |        4.72 ms |          4.72 ms |       4.72 ms |       4.72 ms |          0.00 μs |             1 |
| evmone      |        1.74 ms |          1.74 ms |       1.74 ms |       1.74 ms |          0.00 μs |             1 |
| REVM        |        1.69 ms |          1.69 ms |       1.69 ms |       1.69 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        1.97 ms |          1.97 ms |       1.97 ms |       1.97 ms |          0.00 μs |             1 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       12.91 ms |         12.91 ms |      12.91 ms |      12.91 ms |          0.00 μs |             1 |
| evmone      |        3.98 ms |          3.98 ms |       3.98 ms |       3.98 ms |          0.00 μs |             1 |
| REVM        |        5.85 ms |          5.85 ms |       5.85 ms |       5.85 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        4.56 ms |          4.56 ms |       4.56 ms |       4.56 ms |          0.00 μs |             1 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       18.34 ms |         18.34 ms |      18.34 ms |      18.34 ms |          0.00 μs |             1 |
| evmone      |        6.40 ms |          6.40 ms |       6.40 ms |       6.40 ms |          0.00 μs |             1 |
| REVM        |        8.34 ms |          8.34 ms |       8.34 ms |       8.34 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        6.52 ms |          6.52 ms |       6.52 ms |       6.52 ms |          0.00 μs |             1 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |        9.42 ms |          9.42 ms |       9.42 ms |       9.42 ms |          0.00 μs |             1 |
| evmone      |        3.01 ms |          3.01 ms |       3.01 ms |       3.01 ms |          0.00 μs |             1 |
| REVM        |        3.25 ms |          3.25 ms |       3.25 ms |       3.25 ms |          0.00 μs |             1 |
| Guillotine (Call2) |        2.55 ms |          2.55 ms |       2.55 ms |       2.55 ms |          0.00 μs |             1 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Geth        |       86.55 ms |         86.55 ms |      86.55 ms |      86.55 ms |          0.00 μs |             1 |
| evmone      |       28.43 ms |         28.43 ms |      28.43 ms |      28.43 ms |          0.00 μs |             1 |
| REVM        |       37.72 ms |         37.72 ms |      37.72 ms |      37.72 ms |          0.00 μs |             1 |
| Guillotine (Call2) |       27.73 ms |         27.73 ms |      27.73 ms |      27.73 ms |          0.00 μs |             1 |


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
