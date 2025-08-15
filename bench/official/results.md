# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 2 (EthereumJS: 1)
**EVMs Compared**: Guillotine (Zig ReleaseFast), Guillotine (Zig ReleaseSmall), REVM (Rust), EthereumJS (JavaScript), Geth (Go), evmone (C++)
**Timestamp**: 1755235540 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Fast | Zig-Small | REVM | EthereumJS | Geth | evmone |
|-----------|----------|-----------|------|------------|------|--------|
| erc20-approval-transfer   | 67.72 μs | 67.39 μs | 60.75 μs | 97.52 ms | 8.67 ms | 3.66 ms |
| erc20-mint                | 75.49 μs | 72.27 μs | 60.45 μs | 96.54 ms | 7.53 ms | 2.26 ms |
| erc20-transfer            | 75.49 μs | 70.95 μs | 68.44 μs | 97.52 ms | 11.60 ms | 4.41 ms |
| ten-thousand-hashes       | 52.66 μs | 52.24 μs | 51.53 μs | 94.06 ms | 4.51 ms | 947.35 μs |
| snailtracer               | 1.22 ms | 1.53 ms | 732.55 μs | 98.89 ms | 0.00 μs | 0.00 μs |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Zig Fast) | 67.72 μs | 67.72 μs | 52.24 μs | 83.20 μs | 21.89 μs |            20 |
| Guillotine (Zig Small) | 67.39 μs | 67.39 μs | 66.79 μs | 67.99 μs | 0.85 μs |            20 |
| REVM        | 60.75 μs | 60.75 μs | 56.05 μs | 65.45 μs | 6.65 μs |            20 |
| EthereumJS  | 97.52 ms | 97.52 ms | 96.79 ms | 98.25 ms | 1.03 ms |             1 |
| Geth        | 8.67 ms | 8.67 ms | 8.65 ms | 8.68 ms | 17.25 μs |            20 |
| evmone      | 3.66 ms | 3.66 ms | 3.65 ms | 3.67 ms | 14.40 μs |            20 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Zig Fast) | 75.49 μs | 75.49 μs | 72.83 μs | 78.15 μs | 3.76 μs |            20 |
| Guillotine (Zig Small) | 72.27 μs | 72.27 μs | 68.15 μs | 76.38 μs | 5.82 μs |            20 |
| REVM        | 60.45 μs | 60.45 μs | 56.61 μs | 64.30 μs | 5.44 μs |            20 |
| EthereumJS  | 96.54 ms | 96.54 ms | 95.89 ms | 97.20 ms | 923.27 μs |             1 |
| Geth        | 7.53 ms | 7.53 ms | 7.52 ms | 7.54 ms | 16.97 μs |            20 |
| evmone      | 2.26 ms | 2.26 ms | 2.26 ms | 2.26 ms | 1.38 μs |            20 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Zig Fast) | 75.49 μs | 75.49 μs | 75.42 μs | 75.57 μs | 0.10 μs |            20 |
| Guillotine (Zig Small) | 70.95 μs | 70.95 μs | 64.61 μs | 77.29 μs | 8.97 μs |            20 |
| REVM        | 68.44 μs | 68.44 μs | 66.68 μs | 70.20 μs | 2.49 μs |            20 |
| EthereumJS  | 97.52 ms | 97.52 ms | 96.94 ms | 98.11 ms | 829.05 μs |             1 |
| Geth        | 11.60 ms | 11.60 ms | 11.45 ms | 11.74 ms | 198.54 μs |            20 |
| evmone      | 4.41 ms | 4.41 ms | 4.39 ms | 4.43 ms | 22.57 μs |            20 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Zig Fast) | 52.66 μs | 52.66 μs | 48.32 μs | 57.00 μs | 6.14 μs |            20 |
| Guillotine (Zig Small) | 52.24 μs | 52.24 μs | 51.47 μs | 53.01 μs | 1.08 μs |            20 |
| REVM        | 51.53 μs | 51.53 μs | 50.65 μs | 52.41 μs | 1.24 μs |            20 |
| EthereumJS  | 94.06 ms | 94.06 ms | 93.94 ms | 94.18 ms | 174.15 μs |             1 |
| Geth        | 4.51 ms | 4.51 ms | 4.47 ms | 4.54 ms | 50.83 μs |            20 |
| evmone      | 947.35 μs | 947.35 μs | 938.87 μs | 955.84 μs | 12.00 μs |            20 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Zig Fast) | 1.22 ms | 1.22 ms | 1.20 ms | 1.25 ms | 35.59 μs |             2 |
| Guillotine (Zig Small) | 1.53 ms | 1.53 ms | 1.28 ms | 1.78 ms | 348.38 μs |             2 |
| REVM        | 732.55 μs | 732.55 μs | 731.16 μs | 733.94 μs | 1.96 μs |             2 |
| EthereumJS  | 98.89 ms | 98.89 ms | 98.89 ms | 98.89 ms | 0.00 μs |             1 |


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
