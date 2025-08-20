# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 2 (EthereumJS: 1)
**EVMs Compared**: Guillotine (Zig ReleaseFast), Guillotine (Call2 Interpreter), Guillotine (Zig ReleaseSmall), REVM (Rust), EthereumJS (JavaScript), Geth (Go), evmone (C++)
**Timestamp**: 1755457671 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Fast | Zig-Call2 | Zig-Small | REVM | EthereumJS | Geth | evmone |
|-----------|----------|-----------|-----------|------|------------|------|--------|
| erc20-approval-transfer   | 5.47 ms | 5.15 ms | 7.43 ms | 5.22 ms | 424.87 ms | 9.84 ms | 3.80 ms |
| erc20-mint                | 4.78 ms | 4.17 ms | 7.08 ms | 4.14 ms | 442.20 ms | 8.58 ms | 2.35 ms |
| erc20-transfer            | 7.04 ms | 6.39 ms | 9.93 ms | 6.57 ms | 553.23 ms | 12.90 ms | 4.42 ms |
| ten-thousand-hashes       | 3.04 ms | 1.72 ms | 2.71 ms | 1.70 ms | 323.14 ms | 4.89 ms | 1.27 ms |
| snailtracer               | 95.85 ms | 57.26 ms | 107.59 ms | 36.08 ms | 3.00 s | 109.90 ms | 25.53 ms |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Zig Fast) | 5.47 ms | 5.47 ms | 5.45 ms | 5.49 ms | 25.70 μs |            20 |
| Guillotine (Call2) | 5.15 ms | 5.15 ms | 5.15 ms | 5.16 ms | 2.68 μs |            20 |
| Guillotine (Zig Small) | 7.43 ms | 7.43 ms | 7.42 ms | 7.44 ms | 16.36 μs |            20 |
| REVM        | 5.22 ms | 5.22 ms | 5.14 ms | 5.30 ms | 112.81 μs |            20 |
| EthereumJS  | 424.87 ms | 424.87 ms | 424.52 ms | 425.22 ms | 495.54 μs |             1 |
| Geth        | 9.84 ms | 9.84 ms | 9.84 ms | 9.85 ms | 4.52 μs |            20 |
| evmone      | 3.80 ms | 3.80 ms | 3.79 ms | 3.81 ms | 10.05 μs |            20 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Zig Fast) | 4.78 ms | 4.78 ms | 4.71 ms | 4.85 ms | 103.70 μs |            20 |
| Guillotine (Call2) | 4.17 ms | 4.17 ms | 4.15 ms | 4.19 ms | 31.92 μs |            20 |
| Guillotine (Zig Small) | 7.08 ms | 7.08 ms | 7.03 ms | 7.12 ms | 65.46 μs |            20 |
| REVM        | 4.14 ms | 4.14 ms | 4.13 ms | 4.15 ms | 10.69 μs |            20 |
| EthereumJS  | 442.20 ms | 442.20 ms | 439.19 ms | 445.22 ms | 4.26 ms |             1 |
| Geth        | 8.58 ms | 8.58 ms | 8.57 ms | 8.58 ms | 10.59 μs |            20 |
| evmone      | 2.35 ms | 2.35 ms | 2.32 ms | 2.37 ms | 32.50 μs |            20 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Zig Fast) | 7.04 ms | 7.04 ms | 7.01 ms | 7.08 ms | 48.06 μs |            20 |
| Guillotine (Call2) | 6.39 ms | 6.39 ms | 6.31 ms | 6.47 ms | 112.65 μs |            20 |
| Guillotine (Zig Small) | 9.93 ms | 9.93 ms | 9.89 ms | 9.97 ms | 58.70 μs |            20 |
| REVM        | 6.57 ms | 6.57 ms | 6.54 ms | 6.59 ms | 33.31 μs |            20 |
| EthereumJS  | 553.23 ms | 553.23 ms | 553.20 ms | 553.26 ms | 43.84 μs |             1 |
| Geth        | 12.90 ms | 12.90 ms | 12.89 ms | 12.91 ms | 13.04 μs |            20 |
| evmone      | 4.42 ms | 4.42 ms | 4.37 ms | 4.47 ms | 74.94 μs |            20 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Zig Fast) | 3.04 ms | 3.04 ms | 3.03 ms | 3.05 ms | 10.33 μs |            20 |
| Guillotine (Call2) | 1.72 ms | 1.72 ms | 1.71 ms | 1.73 ms | 15.41 μs |            20 |
| Guillotine (Zig Small) | 2.71 ms | 2.71 ms | 2.69 ms | 2.73 ms | 33.65 μs |            20 |
| REVM        | 1.70 ms | 1.70 ms | 1.67 ms | 1.72 ms | 38.09 μs |            20 |
| EthereumJS  | 323.14 ms | 323.14 ms | 321.25 ms | 325.04 ms | 2.68 ms |             1 |
| Geth        | 4.89 ms | 4.89 ms | 4.87 ms | 4.91 ms | 27.98 μs |            20 |
| evmone      | 1.27 ms | 1.27 ms | 1.27 ms | 1.27 ms | 4.21 μs |            20 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Zig Fast) | 95.85 ms | 95.85 ms | 95.65 ms | 96.05 ms | 276.07 μs |             2 |
| Guillotine (Call2) | 57.26 ms | 57.26 ms | 56.39 ms | 58.13 ms | 1.23 ms |             2 |
| Guillotine (Zig Small) | 107.59 ms | 107.59 ms | 106.15 ms | 109.03 ms | 2.04 ms |             2 |
| REVM        | 36.08 ms | 36.08 ms | 35.55 ms | 36.60 ms | 741.71 μs |             2 |
| EthereumJS  | 3.00 s | 3.00 s | 3.00 s | 3.00 s | 0.00 μs |             1 |
| Geth        | 109.90 ms | 109.90 ms | 109.62 ms | 110.19 ms | 405.60 μs |             2 |
| evmone      | 25.53 ms | 25.53 ms | 25.48 ms | 25.59 ms | 74.64 μs |             2 |


## Notes

- **All times are normalized per individual execution run**
- Times are displayed in the most appropriate unit (μs, ms, or s)
- All implementations use optimized builds:
  - Zig (Fast): ReleaseFast
  - Zig (Call2): ReleaseFast with tailcall-based interpreter
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
