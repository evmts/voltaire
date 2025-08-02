# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 4 (EthereumJS: 1)
**EVMs Compared**: Guillotine (Zig), REVM (Rust), EthereumJS (JavaScript), Geth (Go), evmone (C++)
**Timestamp**: 1754120910 (Unix epoch)

## Performance Comparison

### erc20-approval-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     31.30 |       30.99 |    30.89 |    32.33 |        0.69 |
| REVM        |     26.07 |       26.09 |    25.80 |    26.31 |        0.21 |
| EthereumJS  |   1647.73 |     1645.37 |  1632.40 |  1667.78 |       15.73 |
| Geth        |     53.22 |       53.17 |    52.80 |    53.74 |        0.39 |
| evmone      |      2.00 |        2.00 |     1.92 |     2.07 |        0.07 |

### erc20-mint

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     24.09 |       23.97 |    23.59 |    24.83 |        0.54 |
| REVM        |     20.78 |       20.82 |    20.55 |    20.93 |        0.17 |
| EthereumJS  |   1753.68 |     1754.35 |  1726.85 |  1779.17 |       22.29 |
| Geth        |     47.31 |       47.15 |    46.82 |    48.11 |        0.56 |
| evmone      |      1.85 |        1.85 |     1.81 |     1.91 |        0.04 |

### erc20-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     36.62 |       36.67 |    36.06 |    37.07 |        0.42 |
| REVM        |     32.75 |       32.75 |    32.39 |    33.12 |        0.40 |
| EthereumJS  |   2371.69 |     2366.71 |  2344.64 |  2408.68 |       26.86 |
| Geth        |     68.29 |       68.13 |    67.38 |    69.51 |        1.01 |
| evmone      |      1.92 |        1.91 |     1.83 |     2.02 |        0.08 |

### ten-thousand-hashes

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     15.71 |       15.61 |    15.44 |    16.16 |        0.33 |
| REVM        |      9.70 |        9.68 |     9.52 |     9.92 |        0.17 |
| EthereumJS  |   1111.31 |     1110.76 |  1105.13 |  1118.61 |        5.83 |
| Geth        |     29.13 |       29.11 |    28.91 |    29.37 |        0.19 |
| evmone      |      2.18 |        1.99 |     1.90 |     2.86 |        0.46 |

### snailtracer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |    859.25 |      859.36 |   851.93 |   866.36 |        6.05 |
| REVM        |    285.24 |      286.30 |   281.59 |   286.79 |        2.45 |
| EthereumJS  |  16007.24 |    16007.24 | 16007.24 | 16007.24 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      2.33 |        2.30 |     2.19 |     2.51 |        0.14 |

### opcodes-arithmetic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-arithmetic-advanced

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-bitwise

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-block-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-block-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-comparison

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-control

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-crypto

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-data

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-dup

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-environmental-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-environmental-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-jump-basic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-memory

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-push-pop

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.58 |        2.60 |     2.39 |     2.73 |        0.16 |
| REVM        |      1.75 |        1.76 |     1.70 |     1.78 |        0.04 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.94 |        1.93 |     1.92 |     1.97 |        0.02 |

### opcodes-storage-cold

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-storage-warm

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### opcodes-swap

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### precompile-blake2f

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### precompile-bn256add

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### precompile-bn256mul

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### precompile-bn256pairing

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### precompile-ecrecover

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### precompile-identity

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### precompile-modexp

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### precompile-ripemd160

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

### precompile-sha256

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|

## Overall Performance Summary

| Test Case | Guillotine (ms) | REVM (ms) | EthereumJS (ms) | Geth (ms) | evmone (ms) |
|-----------|-----------------|-----------|-----------|-----------|-------------|
| erc20-approval-transfer   |           31.30 |     26.07 |   1647.73 |     53.22 |        2.00 |
| erc20-mint                |           24.09 |     20.78 |   1753.68 |     47.31 |        1.85 |
| erc20-transfer            |           36.62 |     32.75 |   2371.69 |     68.29 |        1.92 |
| ten-thousand-hashes       |           15.71 |      9.70 |   1111.31 |     29.13 |        2.18 |
| snailtracer               |          859.25 |    285.24 |  16007.24 |      0.00 |        2.33 |
| opcodes-arithmetic        |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-arithmetic-advanced |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-bitwise           |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-block-1           |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-block-2           |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-comparison        |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-control           |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-crypto            |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-data              |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-dup               |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-environmental-1   |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-environmental-2   |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-jump-basic        |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-memory            |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-push-pop          |            2.58 |      1.75 |      0.00 |      0.00 |        1.94 |
| opcodes-storage-cold      |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-storage-warm      |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| opcodes-swap              |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| precompile-blake2f        |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| precompile-bn256add       |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| precompile-bn256mul       |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| precompile-bn256pairing   |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| precompile-ecrecover      |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| precompile-identity       |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| precompile-modexp         |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| precompile-ripemd160      |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |
| precompile-sha256         |            0.00 |      0.00 |      0.00 |      0.00 |        0.00 |

## Notes

- All implementations use optimized builds:
  - Zig: ReleaseFast
  - Rust (REVM): --release
  - JavaScript (EthereumJS): Bun runtime
  - Go (geth): -O3 optimizations
  - C++ (evmone): -O3 -march=native
- All times are in milliseconds (ms)
- Lower values indicate better performance
- These benchmarks measure the full execution time including contract deployment

---

*Generated by Guillotine Benchmark Orchestrator*
