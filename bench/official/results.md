# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 1
**EVMs Compared**: Guillotine Call2 (Zig with tailcall dispatch), REVM (Rust), Geth (Go), evmone (C++)
**Timestamp**: 1756852587 (Unix epoch)

## Overall Performance Summary (Per Run)

| Test Case | Zig-Call2 | REVM | Geth | evmone |
|-----------|-----------|------|------|--------|
| erc20-approval-transfer   |  0.00 μs |   6.20 ms |  14.22 ms |   5.77 ms |
| erc20-mint                |  0.00 μs |   6.22 ms |  14.27 ms |   4.08 ms |
| erc20-transfer            |  0.00 μs |   8.09 ms |  17.84 ms |   6.53 ms |
| ten-thousand-hashes       | 747.16 μs |   3.24 ms |   9.28 ms |   3.01 ms |
| snailtracer               |  0.00 μs |  38.16 ms |  87.30 ms |  27.36 ms |

## Detailed Performance Comparison

### erc20-approval-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| REVM        |        6.20 ms |          6.20 ms |       6.20 ms |       6.20 ms |          0.00 μs |             1 |
| Geth        |       14.22 ms |         14.22 ms |      14.22 ms |      14.22 ms |          0.00 μs |             1 |
| evmone      |        5.77 ms |          5.77 ms |       5.77 ms |       5.77 ms |          0.00 μs |             1 |

### erc20-mint

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| REVM        |        6.22 ms |          6.22 ms |       6.22 ms |       6.22 ms |          0.00 μs |             1 |
| Geth        |       14.27 ms |         14.27 ms |      14.27 ms |      14.27 ms |          0.00 μs |             1 |
| evmone      |        4.08 ms |          4.08 ms |       4.08 ms |       4.08 ms |          0.00 μs |             1 |

### erc20-transfer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| REVM        |        8.09 ms |          8.09 ms |       8.09 ms |       8.09 ms |          0.00 μs |             1 |
| Geth        |       17.84 ms |         17.84 ms |      17.84 ms |      17.84 ms |          0.00 μs |             1 |
| evmone      |        6.53 ms |          6.53 ms |       6.53 ms |       6.53 ms |          0.00 μs |             1 |

### ten-thousand-hashes

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| Guillotine (Call2) |     747.16 μs |       747.16 μs |    747.16 μs |    747.16 μs |          0.00 μs |             1 |
| REVM        |        3.24 ms |          3.24 ms |       3.24 ms |       3.24 ms |          0.00 μs |             1 |
| Geth        |        9.28 ms |          9.28 ms |       9.28 ms |       9.28 ms |          0.00 μs |             1 |
| evmone      |        3.01 ms |          3.01 ms |       3.01 ms |       3.01 ms |          0.00 μs |             1 |

### snailtracer

| EVM | Mean (per run) | Median (per run) | Min (per run) | Max (per run) | Std Dev (per run) | Internal Runs |
|-----|----------------|------------------|---------------|---------------|-------------------|---------------|
| REVM        |       38.16 ms |         38.16 ms |      38.16 ms |      38.16 ms |          0.00 μs |             1 |
| Geth        |       87.30 ms |         87.30 ms |      87.30 ms |      87.30 ms |          0.00 μs |             1 |
| evmone      |       27.36 ms |         27.36 ms |      27.36 ms |      27.36 ms |          0.00 μs |             1 |