# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 2 (EthereumJS: 1)
**EVMs Compared**: Guillotine (Zig), REVM (Rust), EthereumJS (JavaScript), Geth (Go), evmone (C++)
**Timestamp**: 1754103549 (Unix epoch)

## Performance Comparison

### erc20-approval-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     13.26 |       13.26 |    13.18 |    13.34 |        0.11 |
| REVM        |     11.57 |       11.57 |    11.56 |    11.57 |        0.00 |
| EthereumJS  |    744.95 |      744.95 |   740.03 |   749.87 |        6.96 |
| Geth        |     24.68 |       24.68 |    24.63 |    24.72 |        0.06 |
| evmone      |      1.78 |        1.78 |     1.75 |     1.81 |        0.04 |

### erc20-mint

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     10.37 |       10.37 |    10.33 |    10.40 |        0.05 |
| REVM        |      9.37 |        9.37 |     9.30 |     9.45 |        0.10 |
| EthereumJS  |    773.98 |      773.98 |   772.16 |   775.80 |        2.58 |
| Geth        |     22.93 |       22.93 |    22.88 |    22.98 |        0.07 |
| evmone      |      1.88 |        1.88 |     1.88 |     1.89 |        0.00 |

### erc20-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     15.46 |       15.46 |    15.41 |    15.50 |        0.07 |
| REVM        |     14.22 |       14.22 |    14.19 |    14.26 |        0.05 |
| EthereumJS  |   1103.30 |     1103.30 |  1073.89 |  1132.70 |       41.58 |
| Geth        |     31.58 |       31.58 |    31.33 |    31.83 |        0.35 |
| evmone      |      1.97 |        1.97 |     1.82 |     2.12 |        0.21 |

### ten-thousand-hashes

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      7.06 |        7.06 |     7.02 |     7.10 |        0.06 |
| REVM        |      4.58 |        4.58 |     4.57 |     4.58 |        0.00 |
| EthereumJS  |    511.69 |      511.69 |   511.34 |   512.05 |        0.51 |
| Geth        |     14.88 |       14.88 |    14.70 |    15.06 |        0.25 |
| evmone      |      1.69 |        1.69 |     1.68 |     1.70 |        0.01 |

### snailtracer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |    294.71 |      294.71 |   294.51 |   294.91 |        0.28 |
| REVM        |     94.98 |       94.98 |    94.96 |    95.00 |        0.03 |
| EthereumJS  |   3020.44 |     3020.44 |  3020.44 |  3020.44 |        0.00 |
| Geth        |    227.46 |      227.46 |   226.49 |   228.43 |        1.37 |
| evmone      |      1.86 |        1.86 |     1.86 |     1.86 |        0.00 |

### opcodes-arithmetic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.86 |        1.86 |     1.85 |     1.86 |        0.01 |
| Guillotine  |      1.83 |        1.83 |     1.82 |     1.83 |        0.01 |
| REVM        |      1.42 |        1.42 |     1.40 |     1.43 |        0.02 |
| REVM        |      1.43 |        1.43 |     1.43 |     1.43 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.72 |        1.72 |     1.70 |     1.74 |        0.03 |
| evmone      |      1.81 |        1.81 |     1.78 |     1.83 |        0.03 |

### opcodes-arithmetic-advanced

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.86 |        1.86 |     1.85 |     1.86 |        0.01 |
| REVM        |      1.42 |        1.42 |     1.40 |     1.43 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.72 |        1.72 |     1.70 |     1.74 |        0.03 |

### opcodes-bitwise

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.70 |        1.70 |     1.68 |     1.72 |        0.03 |
| REVM        |      1.39 |        1.39 |     1.37 |     1.41 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.82 |        1.82 |     1.74 |     1.89 |        0.11 |

### opcodes-block-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.71 |        2.71 |     2.70 |     2.72 |        0.01 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.44 |        4.44 |     4.33 |     4.55 |        0.16 |
| evmone      |      2.38 |        2.38 |     2.37 |     2.39 |        0.02 |

### opcodes-block-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.30 |        2.30 |     2.30 |     2.31 |        0.00 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.31 |        4.31 |     4.27 |     4.35 |        0.06 |
| evmone      |      2.26 |        2.26 |     2.24 |     2.28 |        0.03 |

### opcodes-comparison

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.86 |        1.86 |     1.86 |     1.87 |        0.01 |
| REVM        |      1.38 |        1.38 |     1.37 |     1.40 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.65 |        1.65 |     1.64 |     1.66 |        0.02 |

### opcodes-control

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.88 |        3.88 |     3.69 |     4.07 |        0.26 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.44 |        4.44 |     4.41 |     4.47 |        0.04 |
| evmone      |      2.72 |        2.72 |     2.69 |     2.75 |        0.04 |

### opcodes-crypto

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.35 |        2.35 |     2.35 |     2.36 |        0.00 |
| REVM        |      1.89 |        1.89 |     1.87 |     1.91 |        0.03 |
| EthereumJS  |    133.39 |      133.39 |   131.59 |   135.20 |        2.55 |
| Geth        |      4.54 |        4.54 |     4.52 |     4.57 |        0.03 |
| evmone      |      1.87 |        1.87 |     1.86 |     1.87 |        0.00 |

### opcodes-data

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.00 |        3.00 |     2.80 |     3.21 |        0.29 |
| REVM        |      1.55 |        1.55 |     1.54 |     1.55 |        0.00 |
| EthereumJS  |    125.00 |      125.00 |   124.88 |   125.11 |        0.16 |
| Geth        |      4.09 |        4.09 |     4.07 |     4.10 |        0.02 |
| evmone      |      2.35 |        2.35 |     2.25 |     2.46 |        0.15 |

### opcodes-dup

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.87 |        1.87 |     1.87 |     1.88 |        0.01 |
| REVM        |      1.49 |        1.49 |     1.44 |     1.54 |        0.07 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.93 |        1.93 |     1.83 |     2.03 |        0.14 |

### opcodes-environmental-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.81 |        1.81 |     1.80 |     1.82 |        0.01 |
| REVM        |      1.46 |        1.46 |     1.44 |     1.47 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.82 |        1.82 |     1.73 |     1.92 |        0.13 |

### opcodes-environmental-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.68 |        2.68 |     2.66 |     2.69 |        0.03 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.63 |        4.63 |     4.61 |     4.64 |        0.02 |
| evmone      |      2.57 |        2.57 |     2.56 |     2.57 |        0.01 |

### opcodes-jump-basic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.76 |        1.76 |     1.73 |     1.78 |        0.03 |
| REVM        |      1.44 |        1.44 |     1.43 |     1.46 |        0.02 |
| EthereumJS  |    118.68 |      118.68 |   117.89 |   119.47 |        1.12 |
| Geth        |      3.90 |        3.90 |     3.88 |     3.93 |        0.03 |
| evmone      |      1.75 |        1.75 |     1.75 |     1.76 |        0.00 |

### opcodes-memory

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.80 |        1.80 |     1.79 |     1.82 |        0.02 |
| REVM        |      1.46 |        1.46 |     1.44 |     1.47 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.80 |        1.80 |     1.77 |     1.82 |        0.03 |

### opcodes-push-pop

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.84 |        1.84 |     1.81 |     1.87 |        0.05 |
| REVM        |      1.49 |        1.49 |     1.44 |     1.55 |        0.07 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.73 |        1.73 |     1.73 |     1.73 |        0.00 |

### opcodes-storage-cold

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.85 |        1.85 |     1.84 |     1.87 |        0.02 |
| REVM        |      1.41 |        1.41 |     1.40 |     1.42 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.88 |        1.88 |     1.78 |     1.97 |        0.13 |

### opcodes-storage-warm

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.82 |        1.82 |     1.79 |     1.85 |        0.04 |
| REVM        |      1.40 |        1.40 |     1.39 |     1.40 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.91 |        1.91 |     1.80 |     2.02 |        0.15 |

### opcodes-swap

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.81 |        1.81 |     1.80 |     1.81 |        0.01 |
| REVM        |      1.38 |        1.38 |     1.37 |     1.40 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.74 |        1.74 |     1.71 |     1.77 |        0.05 |

### precompile-blake2f

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.18 |        2.18 |     2.16 |     2.21 |        0.04 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.20 |        4.20 |     4.07 |     4.34 |        0.19 |
| evmone      |      2.18 |        2.18 |     2.17 |     2.19 |        0.01 |

### precompile-bn256add

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.29 |        3.29 |     3.26 |     3.31 |        0.04 |
| REVM        |      2.47 |        2.47 |     2.19 |     2.74 |        0.39 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.59 |        4.59 |     4.51 |     4.66 |        0.11 |
| evmone      |      1.73 |        1.73 |     1.68 |     1.78 |        0.07 |

### precompile-bn256mul

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.12 |        2.12 |     2.09 |     2.15 |        0.04 |
| REVM        |      1.57 |        1.57 |     1.57 |     1.57 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      8.90 |        8.90 |     8.87 |     8.93 |        0.04 |
| evmone      |      1.78 |        1.78 |     1.71 |     1.86 |        0.10 |

### precompile-bn256pairing

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      5.14 |        5.14 |     4.94 |     5.34 |        0.28 |
| REVM        |      1.47 |        1.47 |     1.46 |     1.47 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |     12.86 |       12.86 |    12.80 |    12.92 |        0.09 |
| evmone      |      1.86 |        1.86 |     1.79 |     1.94 |        0.11 |

### precompile-ecrecover

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.09 |        2.09 |     2.07 |     2.12 |        0.04 |
| REVM        |      1.77 |        1.77 |     1.73 |     1.81 |        0.05 |
| EthereumJS  |    126.90 |      126.90 |   126.12 |   127.68 |        1.11 |
| Geth        |      4.25 |        4.25 |     4.19 |     4.31 |        0.08 |
| evmone      |      1.88 |        1.88 |     1.84 |     1.93 |        0.07 |

### precompile-identity

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      5.30 |        5.30 |     5.25 |     5.34 |        0.06 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.17 |        4.17 |     4.12 |     4.21 |        0.06 |
| evmone      |      2.44 |        2.44 |     2.42 |     2.46 |        0.03 |

### precompile-modexp

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.05 |        2.05 |     2.05 |     2.05 |        0.00 |
| REVM        |      1.43 |        1.43 |     1.42 |     1.43 |        0.01 |
| EthereumJS  |    116.11 |      116.11 |   116.06 |   116.15 |        0.06 |
| Geth        |      4.15 |        4.15 |     4.06 |     4.25 |        0.14 |
| evmone      |      1.74 |        1.74 |     1.73 |     1.74 |        0.01 |

### precompile-ripemd160

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.34 |        2.34 |     2.27 |     2.42 |        0.11 |
| REVM        |      1.50 |        1.50 |     1.49 |     1.51 |        0.01 |
| EthereumJS  |    110.62 |      110.62 |   110.47 |   110.77 |        0.21 |
| Geth        |      4.16 |        4.16 |     3.98 |     4.34 |        0.25 |
| evmone      |      2.02 |        2.02 |     2.01 |     2.03 |        0.01 |

### precompile-sha256

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.82 |        1.82 |     1.81 |     1.84 |        0.02 |
| REVM        |      1.49 |        1.49 |     1.46 |     1.51 |        0.03 |
| EthereumJS  |    109.59 |      109.59 |   109.50 |   109.68 |        0.13 |
| Geth        |      4.03 |        4.03 |     3.97 |     4.09 |        0.09 |
| evmone      |      2.01 |        2.01 |     1.98 |     2.03 |        0.04 |

## Overall Performance Summary

| Test Case | Guillotine (ms) | REVM (ms) | EthereumJS (ms) | Geth (ms) | evmone (ms) |
|-----------|-----------------|-----------|-----------|-----------|-------------|
| erc20-approval-transfer   |           13.26 |     11.57 |    744.95 |     24.68 |        1.78 |
| erc20-mint                |           10.37 |      9.37 |    773.98 |     22.93 |        1.88 |
| erc20-transfer            |           15.46 |     14.22 |   1103.30 |     31.58 |        1.97 |
| ten-thousand-hashes       |            7.06 |      4.58 |    511.69 |     14.88 |        1.69 |
| snailtracer               |          294.71 |     94.98 |   3020.44 |    227.46 |        1.86 |
| opcodes-arithmetic        |            1.83 |      1.43 |      0.00 |      0.00 |        1.81 |
| opcodes-arithmetic-advanced |            1.86 |      1.42 |      0.00 |      0.00 |        1.72 |
| opcodes-bitwise           |            1.70 |      1.39 |      0.00 |      0.00 |        1.82 |
| opcodes-block-1           |            2.71 |      0.00 |      0.00 |      4.44 |        2.38 |
| opcodes-block-2           |            2.30 |      0.00 |      0.00 |      4.31 |        2.26 |
| opcodes-comparison        |            1.86 |      1.38 |      0.00 |      0.00 |        1.65 |
| opcodes-control           |            3.88 |      0.00 |      0.00 |      4.44 |        2.72 |
| opcodes-crypto            |            2.35 |      1.89 |    133.39 |      4.54 |        1.87 |
| opcodes-data              |            3.00 |      1.55 |    125.00 |      4.09 |        2.35 |
| opcodes-dup               |            1.87 |      1.49 |      0.00 |      0.00 |        1.93 |
| opcodes-environmental-1   |            1.81 |      1.46 |      0.00 |      0.00 |        1.82 |
| opcodes-environmental-2   |            2.68 |      0.00 |      0.00 |      4.63 |        2.57 |
| opcodes-jump-basic        |            1.76 |      1.44 |    118.68 |      3.90 |        1.75 |
| opcodes-memory            |            1.80 |      1.46 |      0.00 |      0.00 |        1.80 |
| opcodes-push-pop          |            1.84 |      1.49 |      0.00 |      0.00 |        1.73 |
| opcodes-storage-cold      |            1.85 |      1.41 |      0.00 |      0.00 |        1.88 |
| opcodes-storage-warm      |            1.82 |      1.40 |      0.00 |      0.00 |        1.91 |
| opcodes-swap              |            1.81 |      1.38 |      0.00 |      0.00 |        1.74 |
| precompile-blake2f        |            2.18 |      0.00 |      0.00 |      4.20 |        2.18 |
| precompile-bn256add       |            3.29 |      2.47 |      0.00 |      4.59 |        1.73 |
| precompile-bn256mul       |            2.12 |      1.57 |      0.00 |      8.90 |        1.78 |
| precompile-bn256pairing   |            5.14 |      1.47 |      0.00 |     12.86 |        1.86 |
| precompile-ecrecover      |            2.09 |      1.77 |    126.90 |      4.25 |        1.88 |
| precompile-identity       |            5.30 |      0.00 |      0.00 |      4.17 |        2.44 |
| precompile-modexp         |            2.05 |      1.43 |    116.11 |      4.15 |        1.74 |
| precompile-ripemd160      |            2.34 |      1.50 |    110.62 |      4.16 |        2.02 |
| precompile-sha256         |            1.82 |      1.49 |    109.59 |      4.03 |        2.01 |

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
