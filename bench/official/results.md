# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 2 (EthereumJS: 1)
**EVMs Compared**: Guillotine (Zig ReleaseFast), Guillotine (Zig ReleaseSmall), REVM (Rust), EthereumJS (JavaScript), Geth (Go), evmone (C++)
**Timestamp**: 1755135430 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Fast | Zig-Small | REVM | EthereumJS | Geth | evmone |
|-----------|----------|-----------|------|------------|------|--------|
| erc20-approval-transfer   | 135.17 μs | 141.15 μs | 5.38 ms | 43.41 ms | 10.32 ms | 3.99 ms |
| erc20-mint                | 138.73 μs | 145.54 μs | 4.26 ms | 45.11 ms | 8.86 ms | 2.43 ms |
| erc20-transfer            | 137.15 μs | 140.30 μs | 6.77 ms | 43.38 ms | 13.34 ms | 4.60 ms |
| ten-thousand-hashes       | 72.37 μs | 62.59 μs | 1.79 ms | 44.59 ms | 5.11 ms | 1.37 ms |
| snailtracer               | 21.46 ms | 20.84 ms | 36.84 ms | 43.50 ms | 44.71 ms | 14.12 ms |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Zig Fast) | 135.17 μs | 135.17 μs | 133.82 μs | 136.52 μs | 1.91 μs |            20 |
| Guillotine (Zig Small) | 141.15 μs | 141.15 μs | 140.65 μs | 141.65 μs | 0.71 μs |            20 |
| REVM        | 5.38 ms | 5.38 ms | 5.34 ms | 5.42 ms | 62.03 μs |            20 |
| EthereumJS  | 43.41 ms | 43.41 ms | 43.34 ms | 43.48 ms | 101.82 μs |             1 |
| Geth        | 10.32 ms | 10.32 ms | 10.27 ms | 10.38 ms | 77.13 μs |            20 |
| evmone      | 3.99 ms | 3.99 ms | 3.96 ms | 4.01 ms | 35.62 μs |            20 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Zig Fast) | 138.73 μs | 138.73 μs | 137.91 μs | 139.56 μs | 1.17 μs |            20 |
| Guillotine (Zig Small) | 145.54 μs | 145.54 μs | 143.71 μs | 147.38 μs | 2.59 μs |            20 |
| REVM        | 4.26 ms | 4.26 ms | 4.24 ms | 4.28 ms | 26.37 μs |            20 |
| EthereumJS  | 45.11 ms | 45.11 ms | 43.94 ms | 46.29 ms | 1.66 ms |             1 |
| Geth        | 8.86 ms | 8.86 ms | 8.83 ms | 8.89 ms | 45.70 μs |            20 |
| evmone      | 2.43 ms | 2.43 ms | 2.42 ms | 2.43 ms | 4.00 μs |            20 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Zig Fast) | 137.15 μs | 137.15 μs | 134.22 μs | 140.07 μs | 4.14 μs |            20 |
| Guillotine (Zig Small) | 140.30 μs | 140.30 μs | 137.14 μs | 143.46 μs | 4.46 μs |            20 |
| REVM        | 6.77 ms | 6.77 ms | 6.70 ms | 6.84 ms | 95.01 μs |            20 |
| EthereumJS  | 43.38 ms | 43.38 ms | 42.12 ms | 44.63 ms | 1.77 ms |             1 |
| Geth        | 13.34 ms | 13.34 ms | 13.32 ms | 13.36 ms | 29.27 μs |            20 |
| evmone      | 4.60 ms | 4.60 ms | 4.60 ms | 4.61 ms | 9.57 μs |            20 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Zig Fast) | 72.37 μs | 72.37 μs | 64.08 μs | 80.67 μs | 11.73 μs |            20 |
| Guillotine (Zig Small) | 62.59 μs | 62.59 μs | 60.64 μs | 64.53 μs | 2.75 μs |            20 |
| REVM        | 1.79 ms | 1.79 ms | 1.77 ms | 1.80 ms | 21.35 μs |            20 |
| EthereumJS  | 44.59 ms | 44.59 ms | 44.35 ms | 44.83 ms | 337.44 μs |             1 |
| Geth        | 5.11 ms | 5.11 ms | 5.08 ms | 5.13 ms | 32.44 μs |            20 |
| evmone      | 1.37 ms | 1.37 ms | 1.36 ms | 1.39 ms | 17.06 μs |            20 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Zig Fast) | 21.46 ms | 21.46 ms | 21.23 ms | 21.69 ms | 324.09 μs |             2 |
| Guillotine (Zig Small) | 20.84 ms | 20.84 ms | 20.78 ms | 20.90 ms | 89.33 μs |             2 |
| REVM        | 36.84 ms | 36.84 ms | 36.79 ms | 36.89 ms | 69.81 μs |             2 |
| EthereumJS  | 43.50 ms | 43.50 ms | 43.50 ms | 43.50 ms | 0.00 μs |             1 |
| Geth        | 44.71 ms | 44.71 ms | 44.51 ms | 44.91 ms | 280.69 μs |             2 |
| evmone      | 14.12 ms | 14.12 ms | 14.08 ms | 14.16 ms | 56.35 μs |             2 |


## Notes

- **All times are normalized per individual execution run**
- Times are displayed in the most appropriate unit (μs, ms, or s)
- All implementations use optimized builds:
  - Zig (Fast): ReleaseFast
  - Zig (Small): ReleaseSmall
  - Rust (REVM): --release
  - JavaScript (EthereumJS): Bun runtime
  - Go (geth): -O3 optimizations
  - C++ (evmone): -O3 -march=native
- Lower values indicate better performance
- Each hyperfine run executes the contract multiple times internally (see Internal Runs column)
- These benchmarks measure the full execution time including contract deployment

---

*Generated by Guillotine Benchmark Orchestrator*
