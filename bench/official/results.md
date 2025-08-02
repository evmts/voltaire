# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 4 (EthereumJS: 1)
**EVMs Compared**: Guillotine (Zig), REVM (Rust), EthereumJS (JavaScript), Geth (Go), evmone (C++)
**Timestamp**: 1754117089 (Unix epoch)

## Performance Comparison

### erc20-approval-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     32.35 |       32.45 |    31.91 |    32.58 |        0.31 |
| REVM        |     28.12 |       28.19 |    27.61 |    28.51 |        0.40 |
| EthereumJS  |   1808.65 |     1811.84 |  1781.94 |  1829.01 |       19.56 |
| Geth        |     54.91 |       55.11 |    54.24 |    55.18 |        0.45 |
| evmone      |      2.52 |        1.93 |     1.86 |     4.37 |        1.23 |

### erc20-mint

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     24.09 |       23.98 |    23.88 |    24.52 |        0.29 |
| REVM        |     22.42 |       22.51 |    21.90 |    22.77 |        0.39 |
| EthereumJS  |   1867.14 |     1864.29 |  1860.81 |  1879.19 |        8.21 |
| Geth        |     49.51 |       49.14 |    48.65 |    51.10 |        1.16 |
| evmone      |      1.98 |        1.96 |     1.92 |     2.09 |        0.08 |

### erc20-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     37.71 |       37.71 |    37.55 |    37.87 |        0.13 |
| REVM        |     35.00 |       35.01 |    34.70 |    35.28 |        0.24 |
| EthereumJS  |   2444.15 |     2445.86 |  2421.55 |  2463.33 |       19.43 |
| Geth        |     74.88 |       74.86 |    72.88 |    76.92 |        1.65 |
| evmone      |      1.98 |        1.95 |     1.90 |     2.13 |        0.10 |

### ten-thousand-hashes

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     15.99 |       16.06 |    15.41 |    16.42 |        0.43 |
| REVM        |     10.20 |       10.14 |     9.86 |    10.64 |        0.36 |
| EthereumJS  |   1188.36 |     1184.12 |  1171.24 |  1213.96 |       19.15 |
| Geth        |     30.38 |       30.39 |    30.07 |    30.67 |        0.29 |
| evmone      |      1.94 |        1.93 |     1.87 |     2.05 |        0.08 |

### snailtracer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |    898.85 |      899.47 |   894.72 |   901.73 |        2.98 |
| REVM        |    312.95 |      311.52 |   311.07 |   317.70 |        3.17 |
| EthereumJS  |   3933.23 |     3933.23 |  3933.23 |  3933.23 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      2.10 |        2.09 |     2.06 |     2.17 |        0.05 |

### opcodes-arithmetic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.53 |        2.51 |     2.47 |     2.65 |        0.08 |
| Guillotine  |      2.35 |        2.36 |     2.32 |     2.37 |        0.02 |
| REVM        |      1.90 |        1.87 |     1.84 |     2.03 |        0.09 |
| REVM        |      1.79 |        1.79 |     1.78 |     1.80 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.87 |        1.88 |     1.81 |     1.91 |        0.04 |
| evmone      |      1.91 |        1.91 |     1.89 |     1.94 |        0.02 |

### opcodes-arithmetic-advanced

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.53 |        2.51 |     2.47 |     2.65 |        0.08 |
| REVM        |      1.90 |        1.87 |     1.84 |     2.03 |        0.09 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.87 |        1.88 |     1.81 |     1.91 |        0.04 |

### opcodes-bitwise

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.54 |        2.54 |     2.35 |     2.74 |        0.19 |
| REVM        |      1.85 |        1.85 |     1.84 |     1.88 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      2.06 |        1.92 |     1.91 |     2.48 |        0.28 |

### opcodes-block-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.53 |        3.54 |     3.50 |     3.56 |        0.02 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.99 |        5.00 |     4.91 |     5.04 |        0.07 |
| evmone      |      3.03 |        2.87 |     2.76 |     3.62 |        0.40 |

### opcodes-block-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.37 |        3.34 |     3.31 |     3.48 |        0.07 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      5.85 |        5.84 |     5.34 |     6.38 |        0.43 |
| evmone      |      2.63 |        2.63 |     2.53 |     2.73 |        0.08 |

### opcodes-comparison

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.53 |        2.52 |     2.45 |     2.62 |        0.07 |
| REVM        |      1.85 |        1.86 |     1.80 |     1.87 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.93 |        1.90 |     1.87 |     2.04 |        0.08 |

### opcodes-control

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.86 |        3.78 |     3.74 |     4.14 |        0.19 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      5.89 |        5.63 |     5.41 |     6.90 |        0.69 |
| evmone      |      2.97 |        2.97 |     2.96 |     2.98 |        0.01 |

### opcodes-crypto

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.21 |        3.17 |     3.05 |     3.44 |        0.17 |
| REVM        |      2.53 |        2.56 |     2.45 |     2.57 |        0.06 |
| EthereumJS  |    171.93 |      172.03 |   170.31 |   173.32 |        1.27 |
| Geth        |      5.32 |        5.30 |     5.26 |     5.41 |        0.07 |
| evmone      |      2.11 |        2.14 |     2.00 |     2.17 |        0.08 |

### opcodes-data

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.90 |        2.91 |     2.83 |     2.94 |        0.05 |
| REVM        |      2.14 |        2.14 |     2.10 |     2.18 |        0.03 |
| EthereumJS  |    165.83 |      165.28 |   164.55 |   168.19 |        1.62 |
| Geth        |      5.12 |        5.11 |     4.87 |     5.40 |        0.22 |
| evmone      |      2.51 |        2.50 |     2.37 |     2.69 |        0.14 |

### opcodes-dup

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.64 |        2.56 |     2.49 |     2.97 |        0.22 |
| REVM        |      1.83 |        1.81 |     1.80 |     1.90 |        0.05 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.90 |        1.82 |     1.79 |     2.16 |        0.18 |

### opcodes-environmental-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.41 |        2.41 |     2.40 |     2.44 |        0.02 |
| REVM        |      1.81 |        1.82 |     1.76 |     1.86 |        0.05 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      2.10 |        1.94 |     1.85 |     2.67 |        0.38 |

### opcodes-environmental-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      4.06 |        4.03 |     3.94 |     4.24 |        0.13 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      5.19 |        5.20 |     4.80 |     5.57 |        0.31 |
| evmone      |      3.09 |        3.09 |     2.94 |     3.24 |        0.16 |

### opcodes-jump-basic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.48 |        2.46 |     2.32 |     2.66 |        0.15 |
| REVM        |      1.82 |        1.80 |     1.74 |     1.91 |        0.07 |
| EthereumJS  |    141.83 |      140.50 |   140.22 |   146.09 |        2.85 |
| Geth        |      4.47 |        4.45 |     4.15 |     4.82 |        0.28 |
| evmone      |      1.83 |        1.82 |     1.81 |     1.85 |        0.02 |

### opcodes-memory

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.48 |        2.48 |     2.46 |     2.52 |        0.03 |
| REVM        |      1.78 |        1.79 |     1.74 |     1.81 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.95 |        1.96 |     1.79 |     2.11 |        0.17 |

### opcodes-push-pop

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.48 |        2.45 |     2.35 |     2.68 |        0.14 |
| REVM        |      1.84 |        1.84 |     1.78 |     1.89 |        0.05 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.87 |        1.86 |     1.85 |     1.90 |        0.02 |

### opcodes-storage-cold

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.39 |        2.37 |     2.33 |     2.48 |        0.07 |
| REVM        |      1.90 |        1.89 |     1.86 |     1.95 |        0.04 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.99 |        1.99 |     1.95 |     2.02 |        0.03 |

### opcodes-storage-warm

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.34 |        2.34 |     2.30 |     2.38 |        0.03 |
| REVM        |      1.83 |        1.82 |     1.78 |     1.88 |        0.05 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.96 |        1.96 |     1.86 |     2.07 |        0.10 |

### opcodes-swap

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.50 |        2.47 |     2.37 |     2.68 |        0.14 |
| REVM        |      1.84 |        1.84 |     1.80 |     1.88 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.92 |        1.89 |     1.87 |     2.04 |        0.08 |

### precompile-blake2f

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.05 |        3.03 |     3.02 |     3.12 |        0.05 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      5.27 |        5.28 |     5.00 |     5.52 |        0.29 |
| evmone      |      2.55 |        2.52 |     2.48 |     2.70 |        0.10 |

### precompile-bn256add

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      4.28 |        4.26 |     4.14 |     4.45 |        0.14 |
| REVM        |      2.43 |        2.45 |     2.21 |     2.62 |        0.18 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      5.20 |        5.14 |     5.11 |     5.43 |        0.16 |
| evmone      |      1.92 |        1.93 |     1.86 |     1.97 |        0.05 |

### precompile-bn256mul

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.68 |        2.67 |     2.64 |     2.76 |        0.06 |
| REVM        |      2.18 |        2.19 |     2.11 |     2.24 |        0.06 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |     10.75 |       10.76 |    10.27 |    11.22 |        0.45 |
| evmone      |      1.93 |        1.93 |     1.90 |     1.97 |        0.03 |

### precompile-bn256pairing

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      6.43 |        6.48 |     6.11 |     6.66 |        0.24 |
| REVM        |      1.83 |        1.83 |     1.79 |     1.89 |        0.04 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |     14.69 |       14.71 |    14.56 |    14.78 |        0.10 |
| evmone      |      1.95 |        1.93 |     1.91 |     2.04 |        0.06 |

### precompile-ecrecover

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.98 |        2.97 |     2.90 |     3.08 |        0.08 |
| REVM        |      2.23 |        2.22 |     2.20 |     2.28 |        0.04 |
| EthereumJS  |    163.04 |      162.95 |   161.62 |   164.66 |        1.36 |
| Geth        |      4.79 |        4.70 |     4.53 |     5.25 |        0.32 |
| evmone      |      2.04 |        2.07 |     1.95 |     2.09 |        0.06 |

### precompile-identity

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      6.96 |        6.92 |     6.88 |     7.11 |        0.11 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.58 |        4.58 |     4.51 |     4.63 |        0.05 |
| evmone      |      2.55 |        2.55 |     2.52 |     2.57 |        0.02 |

### precompile-modexp

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.66 |        2.66 |     2.63 |     2.68 |        0.02 |
| REVM        |      1.84 |        1.84 |     1.83 |     1.85 |        0.01 |
| EthereumJS  |    151.80 |      151.04 |   147.60 |   157.52 |        4.22 |
| Geth        |      4.69 |        4.72 |     4.48 |     4.83 |        0.15 |
| evmone      |      1.90 |        1.88 |     1.81 |     2.03 |        0.10 |

### precompile-ripemd160

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.79 |        2.75 |     2.70 |     2.97 |        0.12 |
| REVM        |      1.98 |        1.99 |     1.90 |     2.03 |        0.06 |
| EthereumJS  |    140.85 |      141.20 |   139.20 |   141.80 |        1.15 |
| Geth        |      4.96 |        4.83 |     4.60 |     5.57 |        0.43 |
| evmone      |      2.28 |        2.25 |     2.18 |     2.45 |        0.13 |

### precompile-sha256

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.68 |        2.69 |     2.59 |     2.76 |        0.07 |
| REVM        |      2.01 |        2.03 |     1.91 |     2.08 |        0.08 |
| EthereumJS  |    142.04 |      142.39 |   139.75 |   143.65 |        1.66 |
| Geth        |      4.50 |        4.51 |     4.36 |     4.61 |        0.10 |
| evmone      |      2.28 |        2.30 |     2.23 |     2.31 |        0.04 |

## Overall Performance Summary

| Test Case | Guillotine (ms) | REVM (ms) | EthereumJS (ms) | Geth (ms) | evmone (ms) |
|-----------|-----------------|-----------|-----------|-----------|-------------|
| erc20-approval-transfer   |           32.35 |     28.12 |   1808.65 |     54.91 |        2.52 |
| erc20-mint                |           24.09 |     22.42 |   1867.14 |     49.51 |        1.98 |
| erc20-transfer            |           37.71 |     35.00 |   2444.15 |     74.88 |        1.98 |
| ten-thousand-hashes       |           15.99 |     10.20 |   1188.36 |     30.38 |        1.94 |
| snailtracer               |          898.85 |    312.95 |   3933.23 |      0.00 |        2.10 |
| opcodes-arithmetic        |            2.35 |      1.79 |      0.00 |      0.00 |        1.91 |
| opcodes-arithmetic-advanced |            2.53 |      1.90 |      0.00 |      0.00 |        1.87 |
| opcodes-bitwise           |            2.54 |      1.85 |      0.00 |      0.00 |        2.06 |
| opcodes-block-1           |            3.53 |      0.00 |      0.00 |      4.99 |        3.03 |
| opcodes-block-2           |            3.37 |      0.00 |      0.00 |      5.85 |        2.63 |
| opcodes-comparison        |            2.53 |      1.85 |      0.00 |      0.00 |        1.93 |
| opcodes-control           |            3.86 |      0.00 |      0.00 |      5.89 |        2.97 |
| opcodes-crypto            |            3.21 |      2.53 |    171.93 |      5.32 |        2.11 |
| opcodes-data              |            2.90 |      2.14 |    165.83 |      5.12 |        2.51 |
| opcodes-dup               |            2.64 |      1.83 |      0.00 |      0.00 |        1.90 |
| opcodes-environmental-1   |            2.41 |      1.81 |      0.00 |      0.00 |        2.10 |
| opcodes-environmental-2   |            4.06 |      0.00 |      0.00 |      5.19 |        3.09 |
| opcodes-jump-basic        |            2.48 |      1.82 |    141.83 |      4.47 |        1.83 |
| opcodes-memory            |            2.48 |      1.78 |      0.00 |      0.00 |        1.95 |
| opcodes-push-pop          |            2.48 |      1.84 |      0.00 |      0.00 |        1.87 |
| opcodes-storage-cold      |            2.39 |      1.90 |      0.00 |      0.00 |        1.99 |
| opcodes-storage-warm      |            2.34 |      1.83 |      0.00 |      0.00 |        1.96 |
| opcodes-swap              |            2.50 |      1.84 |      0.00 |      0.00 |        1.92 |
| precompile-blake2f        |            3.05 |      0.00 |      0.00 |      5.27 |        2.55 |
| precompile-bn256add       |            4.28 |      2.43 |      0.00 |      5.20 |        1.92 |
| precompile-bn256mul       |            2.68 |      2.18 |      0.00 |     10.75 |        1.93 |
| precompile-bn256pairing   |            6.43 |      1.83 |      0.00 |     14.69 |        1.95 |
| precompile-ecrecover      |            2.98 |      2.23 |    163.04 |      4.79 |        2.04 |
| precompile-identity       |            6.96 |      0.00 |      0.00 |      4.58 |        2.55 |
| precompile-modexp         |            2.66 |      1.84 |    151.80 |      4.69 |        1.90 |
| precompile-ripemd160      |            2.79 |      1.98 |    140.85 |      4.96 |        2.28 |
| precompile-sha256         |            2.68 |      2.01 |    142.04 |      4.50 |        2.28 |

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
