# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 4 (EthereumJS: 1)
**EVMs Compared**: Guillotine (Zig), REVM (Rust), EthereumJS (JavaScript), Geth (Go), evmone (C++)
**Timestamp**: 1754119454 (Unix epoch)

## Performance Comparison

### erc20-approval-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     33.81 |       33.76 |    33.14 |    34.57 |        0.60 |
| REVM        |     29.41 |       29.49 |    28.86 |    29.78 |        0.39 |
| EthereumJS  |   1886.99 |     1883.30 |  1881.64 |  1899.74 |        8.62 |
| Geth        |     58.87 |       58.99 |    58.34 |    59.16 |        0.37 |
| evmone      |      2.20 |        2.19 |     2.15 |     2.27 |        0.05 |

### erc20-mint

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     25.21 |       25.17 |    24.83 |    25.66 |        0.38 |
| REVM        |     23.49 |       23.46 |    23.21 |    23.83 |        0.31 |
| EthereumJS  |   1966.21 |     1968.16 |  1952.05 |  1976.48 |       11.88 |
| Geth        |     52.04 |       51.83 |    51.47 |    53.01 |        0.67 |
| evmone      |      2.08 |        2.08 |     2.06 |     2.12 |        0.02 |

### erc20-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     39.81 |       39.77 |    39.76 |    39.92 |        0.08 |
| REVM        |     37.12 |       37.08 |    36.90 |    37.44 |        0.25 |
| EthereumJS  |   2570.79 |     2565.26 |  2550.87 |  2601.76 |       22.14 |
| Geth        |     75.52 |       75.62 |    74.73 |    76.13 |        0.58 |
| evmone      |      2.05 |        2.04 |     2.02 |     2.10 |        0.03 |

### ten-thousand-hashes

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     16.87 |       16.81 |    16.59 |    17.28 |        0.30 |
| REVM        |     10.84 |       10.82 |    10.71 |    11.00 |        0.13 |
| EthereumJS  |   1269.35 |     1259.45 |  1246.92 |  1311.58 |       28.77 |
| Geth        |     32.50 |       32.55 |    32.10 |    32.82 |        0.30 |
| evmone      |      2.16 |        2.15 |     2.12 |     2.20 |        0.03 |

### snailtracer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |    953.39 |      952.48 |   949.15 |   959.44 |        4.41 |
| REVM        |    329.41 |      328.00 |   326.95 |   334.70 |        3.57 |
| EthereumJS  |  17023.39 |    17023.39 | 17023.39 | 17023.39 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      2.20 |        2.20 |     2.19 |     2.21 |        0.01 |

### opcodes-arithmetic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.85 |        2.84 |     2.53 |     3.17 |        0.26 |
| Guillotine  |      2.51 |        2.51 |     2.50 |     2.54 |        0.02 |
| REVM        |      2.04 |        2.04 |     1.99 |     2.07 |        0.03 |
| REVM        |      2.03 |        2.02 |     1.93 |     2.16 |        0.10 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.97 |        1.97 |     1.95 |     2.01 |        0.02 |
| evmone      |      2.05 |        2.04 |     1.99 |     2.13 |        0.06 |

### opcodes-arithmetic-advanced

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.85 |        2.84 |     2.53 |     3.17 |        0.26 |
| REVM        |      2.04 |        2.04 |     1.99 |     2.07 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.97 |        1.97 |     1.95 |     2.01 |        0.02 |

### opcodes-bitwise

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.50 |        2.49 |     2.48 |     2.55 |        0.03 |
| REVM        |      1.89 |        1.89 |     1.83 |     1.94 |        0.04 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      2.04 |        2.02 |     2.01 |     2.08 |        0.03 |

### opcodes-block-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.90 |        3.89 |     3.77 |     4.05 |        0.12 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      5.55 |        5.62 |     5.24 |     5.71 |        0.21 |
| evmone      |      3.04 |        3.02 |     2.90 |     3.22 |        0.13 |

### opcodes-block-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.54 |        3.51 |     3.40 |     3.74 |        0.15 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      5.46 |        5.51 |     5.06 |     5.77 |        0.34 |
| evmone      |      2.76 |        2.74 |     2.72 |     2.85 |        0.06 |

### opcodes-comparison

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.50 |        2.48 |     2.46 |     2.57 |        0.05 |
| REVM        |      1.92 |        1.92 |     1.89 |     1.96 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      2.09 |        2.10 |     2.01 |     2.13 |        0.06 |

### opcodes-control

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      4.20 |        4.21 |     4.06 |     4.30 |        0.11 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      5.42 |        5.39 |     5.24 |     5.66 |        0.20 |
| evmone      |      3.27 |        3.25 |     3.20 |     3.39 |        0.09 |

### opcodes-crypto

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.38 |        3.37 |     3.21 |     3.57 |        0.19 |
| REVM        |      2.58 |        2.57 |     2.55 |     2.63 |        0.04 |
| EthereumJS  |    181.34 |      181.44 |   179.84 |   182.64 |        1.18 |
| Geth        |      5.69 |        5.69 |     5.47 |     5.89 |        0.19 |
| evmone      |      2.27 |        2.27 |     2.24 |     2.30 |        0.03 |

### opcodes-data

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.45 |        3.47 |     3.24 |     3.61 |        0.17 |
| REVM        |      2.30 |        2.29 |     2.23 |     2.41 |        0.08 |
| EthereumJS  |    170.36 |      170.25 |   169.87 |   171.08 |        0.51 |
| Geth        |      5.04 |        5.04 |     4.97 |     5.12 |        0.06 |
| evmone      |      2.53 |        2.53 |     2.46 |     2.59 |        0.07 |

### opcodes-dup

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.61 |        2.61 |     2.50 |     2.71 |        0.10 |
| REVM        |      1.97 |        1.98 |     1.90 |     2.03 |        0.07 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.98 |        1.98 |     1.97 |     1.99 |        0.01 |

### opcodes-environmental-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.67 |        2.64 |     2.47 |     2.95 |        0.20 |
| REVM        |      1.96 |        1.95 |     1.92 |     1.99 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      2.00 |        2.00 |     1.99 |     2.00 |        0.01 |

### opcodes-environmental-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      4.24 |        4.28 |     4.00 |     4.38 |        0.16 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      5.39 |        5.40 |     5.17 |     5.61 |        0.22 |
| evmone      |      3.50 |        3.27 |     3.13 |     4.32 |        0.55 |

### opcodes-jump-basic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.58 |        2.54 |     2.50 |     2.75 |        0.12 |
| REVM        |      1.97 |        1.94 |     1.89 |     2.10 |        0.10 |
| EthereumJS  |    147.96 |      148.15 |   146.32 |   149.21 |        1.21 |
| Geth        |      4.63 |        4.64 |     4.50 |     4.74 |        0.10 |
| evmone      |      2.03 |        2.03 |     1.96 |     2.10 |        0.05 |

### opcodes-memory

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.57 |        2.56 |     2.52 |     2.65 |        0.06 |
| REVM        |      1.97 |        1.97 |     1.88 |     2.07 |        0.08 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      2.00 |        2.00 |     1.99 |     2.01 |        0.01 |

### opcodes-push-pop

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.52 |        2.51 |     2.46 |     2.60 |        0.06 |
| REVM        |      1.93 |        1.93 |     1.86 |     2.02 |        0.07 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      2.13 |        2.13 |     2.11 |     2.16 |        0.02 |

### opcodes-storage-cold

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.60 |        2.60 |     2.53 |     2.67 |        0.06 |
| REVM        |      1.91 |        1.90 |     1.86 |     1.98 |        0.05 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      2.02 |        2.00 |     1.98 |     2.11 |        0.06 |

### opcodes-storage-warm

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.50 |        2.48 |     2.47 |     2.58 |        0.05 |
| REVM        |      2.03 |        2.03 |     1.94 |     2.12 |        0.07 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.98 |        1.99 |     1.94 |     2.00 |        0.03 |

### opcodes-swap

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.75 |        2.71 |     2.62 |     2.96 |        0.15 |
| REVM        |      1.88 |        1.88 |     1.87 |     1.89 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      2.12 |        2.11 |     2.09 |     2.15 |        0.03 |

### precompile-blake2f

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.41 |        3.30 |     3.25 |     3.80 |        0.26 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      5.05 |        5.04 |     4.82 |     5.32 |        0.21 |
| evmone      |      2.84 |        2.85 |     2.71 |     2.94 |        0.10 |

### precompile-bn256add

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      4.56 |        4.57 |     4.45 |     4.64 |        0.08 |
| REVM        |      2.34 |        2.34 |     2.27 |     2.43 |        0.07 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      5.66 |        5.67 |     5.46 |     5.81 |        0.16 |
| evmone      |      2.04 |        2.04 |     2.02 |     2.06 |        0.02 |

### precompile-bn256mul

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.07 |        3.08 |     2.91 |     3.21 |        0.13 |
| REVM        |      2.26 |        2.23 |     2.19 |     2.39 |        0.09 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |     13.31 |       13.82 |    11.53 |    14.07 |        1.19 |
| evmone      |      2.22 |        2.21 |     2.17 |     2.29 |        0.05 |

### precompile-bn256pairing

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      6.45 |        6.45 |     6.43 |     6.49 |        0.03 |
| REVM        |      1.92 |        1.91 |     1.90 |     1.96 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |     16.47 |       16.44 |    16.02 |    16.98 |        0.40 |
| evmone      |      2.07 |        2.07 |     2.03 |     2.12 |        0.04 |

### precompile-ecrecover

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.21 |        3.22 |     3.12 |     3.29 |        0.09 |
| REVM        |      2.38 |        2.37 |     2.37 |     2.39 |        0.01 |
| EthereumJS  |    175.06 |      174.85 |   173.56 |   176.99 |        1.48 |
| Geth        |      5.16 |        5.16 |     4.92 |     5.39 |        0.25 |
| evmone      |      2.22 |        2.23 |     2.14 |     2.29 |        0.07 |

### precompile-identity

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      7.50 |        7.47 |     7.20 |     7.85 |        0.27 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      6.46 |        6.50 |     5.48 |     7.35 |        0.80 |
| evmone      |      2.70 |        2.73 |     2.56 |     2.76 |        0.09 |

### precompile-modexp

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.05 |        3.05 |     3.01 |     3.07 |        0.03 |
| REVM        |      2.06 |        2.05 |     1.96 |     2.18 |        0.09 |
| EthereumJS  |    158.20 |      158.66 |   156.17 |   159.30 |        1.45 |
| Geth        |      5.07 |        5.11 |     4.78 |     5.30 |        0.22 |
| evmone      |      2.04 |        2.04 |     2.01 |     2.05 |        0.02 |

### precompile-ripemd160

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.92 |        2.88 |     2.74 |     3.20 |        0.20 |
| REVM        |      2.08 |        2.08 |     1.96 |     2.20 |        0.10 |
| EthereumJS  |    151.13 |      149.75 |   148.64 |   156.35 |        3.53 |
| Geth        |      4.80 |        4.76 |     4.66 |     5.02 |        0.16 |
| evmone      |      2.35 |        2.35 |     2.28 |     2.43 |        0.06 |

### precompile-sha256

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.97 |        2.95 |     2.86 |     3.12 |        0.11 |
| REVM        |      2.18 |        2.17 |     2.13 |     2.23 |        0.04 |
| EthereumJS  |    148.40 |      148.82 |   146.86 |   149.09 |        1.03 |
| Geth        |      4.67 |        4.65 |     4.58 |     4.80 |        0.10 |
| evmone      |      2.31 |        2.32 |     2.28 |     2.33 |        0.02 |

## Overall Performance Summary

| Test Case | Guillotine (ms) | REVM (ms) | EthereumJS (ms) | Geth (ms) | evmone (ms) |
|-----------|-----------------|-----------|-----------|-----------|-------------|
| erc20-approval-transfer   |           33.81 |     29.41 |   1886.99 |     58.87 |        2.20 |
| erc20-mint                |           25.21 |     23.49 |   1966.21 |     52.04 |        2.08 |
| erc20-transfer            |           39.81 |     37.12 |   2570.79 |     75.52 |        2.05 |
| ten-thousand-hashes       |           16.87 |     10.84 |   1269.35 |     32.50 |        2.16 |
| snailtracer               |          953.39 |    329.41 |  17023.39 |      0.00 |        2.20 |
| opcodes-arithmetic        |            2.51 |      2.03 |      0.00 |      0.00 |        2.05 |
| opcodes-arithmetic-advanced |            2.85 |      2.04 |      0.00 |      0.00 |        1.97 |
| opcodes-bitwise           |            2.50 |      1.89 |      0.00 |      0.00 |        2.04 |
| opcodes-block-1           |            3.90 |      0.00 |      0.00 |      5.55 |        3.04 |
| opcodes-block-2           |            3.54 |      0.00 |      0.00 |      5.46 |        2.76 |
| opcodes-comparison        |            2.50 |      1.92 |      0.00 |      0.00 |        2.09 |
| opcodes-control           |            4.20 |      0.00 |      0.00 |      5.42 |        3.27 |
| opcodes-crypto            |            3.38 |      2.58 |    181.34 |      5.69 |        2.27 |
| opcodes-data              |            3.45 |      2.30 |    170.36 |      5.04 |        2.53 |
| opcodes-dup               |            2.61 |      1.97 |      0.00 |      0.00 |        1.98 |
| opcodes-environmental-1   |            2.67 |      1.96 |      0.00 |      0.00 |        2.00 |
| opcodes-environmental-2   |            4.24 |      0.00 |      0.00 |      5.39 |        3.50 |
| opcodes-jump-basic        |            2.58 |      1.97 |    147.96 |      4.63 |        2.03 |
| opcodes-memory            |            2.57 |      1.97 |      0.00 |      0.00 |        2.00 |
| opcodes-push-pop          |            2.52 |      1.93 |      0.00 |      0.00 |        2.13 |
| opcodes-storage-cold      |            2.60 |      1.91 |      0.00 |      0.00 |        2.02 |
| opcodes-storage-warm      |            2.50 |      2.03 |      0.00 |      0.00 |        1.98 |
| opcodes-swap              |            2.75 |      1.88 |      0.00 |      0.00 |        2.12 |
| precompile-blake2f        |            3.41 |      0.00 |      0.00 |      5.05 |        2.84 |
| precompile-bn256add       |            4.56 |      2.34 |      0.00 |      5.66 |        2.04 |
| precompile-bn256mul       |            3.07 |      2.26 |      0.00 |     13.31 |        2.22 |
| precompile-bn256pairing   |            6.45 |      1.92 |      0.00 |     16.47 |        2.07 |
| precompile-ecrecover      |            3.21 |      2.38 |    175.06 |      5.16 |        2.22 |
| precompile-identity       |            7.50 |      0.00 |      0.00 |      6.46 |        2.70 |
| precompile-modexp         |            3.05 |      2.06 |    158.20 |      5.07 |        2.04 |
| precompile-ripemd160      |            2.92 |      2.08 |    151.13 |      4.80 |        2.35 |
| precompile-sha256         |            2.97 |      2.18 |    148.40 |      4.67 |        2.31 |

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
