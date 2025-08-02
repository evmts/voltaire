# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 2 (EthereumJS: 1)
**EVMs Compared**: Guillotine (Zig), REVM (Rust), EthereumJS (JavaScript), Geth (Go), evmone (C++)
**Timestamp**: 1754103770 (Unix epoch)

## Performance Comparison

### erc20-approval-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     14.41 |       14.41 |    14.38 |    14.44 |        0.05 |
| REVM        |     11.83 |       11.83 |    11.80 |    11.85 |        0.03 |
| EthereumJS  |    767.52 |      767.52 |   758.18 |   776.86 |       13.20 |
| Geth        |     25.47 |       25.47 |    25.45 |    25.49 |        0.03 |
| evmone      |      1.57 |        1.57 |     1.56 |     1.58 |        0.02 |

### erc20-mint

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     11.20 |       11.20 |    10.62 |    11.78 |        0.82 |
| REVM        |      9.76 |        9.76 |     9.65 |     9.86 |        0.15 |
| EthereumJS  |    786.73 |      786.73 |   782.65 |   790.81 |        5.77 |
| Geth        |     24.74 |       24.74 |    23.11 |    26.38 |        2.31 |
| evmone      |      1.58 |        1.58 |     1.56 |     1.59 |        0.02 |

### erc20-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     15.68 |       15.68 |    15.68 |    15.68 |        0.00 |
| REVM        |     16.02 |       16.02 |    15.65 |    16.39 |        0.52 |
| EthereumJS  |   1024.63 |     1024.63 |  1010.78 |  1038.48 |       19.59 |
| Geth        |     33.15 |       33.15 |    32.96 |    33.34 |        0.27 |
| evmone      |      1.69 |        1.69 |     1.66 |     1.72 |        0.04 |

### ten-thousand-hashes

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      8.16 |        8.16 |     7.50 |     8.81 |        0.93 |
| REVM        |      4.81 |        4.81 |     4.77 |     4.85 |        0.06 |
| EthereumJS  |    545.77 |      545.77 |   541.22 |   550.32 |        6.43 |
| Geth        |     15.52 |       15.52 |    15.43 |    15.61 |        0.13 |
| evmone      |      1.57 |        1.57 |     1.51 |     1.63 |        0.09 |

### snailtracer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |    295.05 |      295.05 |   294.58 |   295.53 |        0.67 |
| REVM        |     98.89 |       98.89 |    98.69 |    99.09 |        0.28 |
| EthereumJS  |   3043.87 |     3043.87 |  3043.87 |  3043.87 |        0.00 |
| Geth        |    225.62 |      225.62 |   222.28 |   228.95 |        4.71 |
| evmone      |      1.75 |        1.75 |     1.71 |     1.78 |        0.05 |

### opcodes-arithmetic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.01 |        2.01 |     1.97 |     2.05 |        0.06 |
| Guillotine  |      1.85 |        1.85 |     1.83 |     1.87 |        0.03 |
| REVM        |      1.45 |        1.45 |     1.44 |     1.45 |        0.01 |
| REVM        |      1.71 |        1.71 |     1.66 |     1.77 |        0.08 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.54 |        1.54 |     1.51 |     1.56 |        0.03 |
| evmone      |      1.59 |        1.59 |     1.55 |     1.62 |        0.05 |

### opcodes-arithmetic-advanced

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.01 |        2.01 |     1.97 |     2.05 |        0.06 |
| REVM        |      1.45 |        1.45 |     1.44 |     1.45 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.54 |        1.54 |     1.51 |     1.56 |        0.03 |

### opcodes-bitwise

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.05 |        2.05 |     1.91 |     2.20 |        0.20 |
| REVM        |      1.39 |        1.39 |     1.33 |     1.44 |        0.08 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.55 |        1.55 |     1.51 |     1.60 |        0.07 |

### opcodes-block-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.58 |        2.58 |     2.55 |     2.62 |        0.05 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.45 |        4.45 |     4.26 |     4.63 |        0.27 |
| evmone      |      2.28 |        2.28 |     2.27 |     2.29 |        0.01 |

### opcodes-block-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.50 |        2.50 |     2.49 |     2.51 |        0.01 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.46 |        4.46 |     4.26 |     4.66 |        0.28 |
| evmone      |      2.12 |        2.12 |     2.06 |     2.18 |        0.09 |

### opcodes-comparison

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.46 |        2.46 |     2.21 |     2.72 |        0.37 |
| REVM        |      1.45 |        1.45 |     1.45 |     1.45 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.62 |        1.62 |     1.60 |     1.64 |        0.03 |

### opcodes-control

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      4.83 |        4.83 |     4.60 |     5.07 |        0.33 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.67 |        4.67 |     4.57 |     4.77 |        0.14 |
| evmone      |      7.30 |        7.30 |     6.62 |     7.98 |        0.96 |

### opcodes-crypto

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.74 |        2.74 |     2.70 |     2.78 |        0.06 |
| REVM        |      1.99 |        1.99 |     1.99 |     1.99 |        0.00 |
| EthereumJS  |    134.78 |      134.78 |   134.52 |   135.05 |        0.37 |
| Geth        |      4.50 |        4.50 |     4.42 |     4.58 |        0.11 |
| evmone      |      1.67 |        1.67 |     1.64 |     1.69 |        0.04 |

### opcodes-data

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.37 |        3.37 |     3.28 |     3.47 |        0.14 |
| REVM        |      1.64 |        1.64 |     1.63 |     1.65 |        0.01 |
| EthereumJS  |    128.92 |      128.92 |   127.57 |   130.27 |        1.91 |
| Geth        |      4.40 |        4.40 |     4.31 |     4.49 |        0.13 |
| evmone      |      3.71 |        3.71 |     3.34 |     4.08 |        0.53 |

### opcodes-dup

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.95 |        1.95 |     1.91 |     1.99 |        0.06 |
| REVM        |      1.92 |        1.92 |     1.91 |     1.94 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.75 |        1.75 |     1.72 |     1.77 |        0.04 |

### opcodes-environmental-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.79 |        1.79 |     1.76 |     1.81 |        0.04 |
| REVM        |      1.72 |        1.72 |     1.63 |     1.82 |        0.14 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.61 |        1.61 |     1.61 |     1.61 |        0.00 |

### opcodes-environmental-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.49 |        3.49 |     3.30 |     3.68 |        0.27 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.58 |        4.58 |     4.49 |     4.68 |        0.14 |
| evmone      |      2.86 |        2.86 |     2.81 |     2.91 |        0.07 |

### opcodes-jump-basic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.85 |        1.85 |     1.76 |     1.93 |        0.12 |
| REVM        |      1.56 |        1.56 |     1.47 |     1.65 |        0.13 |
| EthereumJS  |    114.73 |      114.73 |   113.51 |   115.95 |        1.72 |
| Geth        |      3.92 |        3.92 |     3.78 |     4.05 |        0.19 |
| evmone      |      1.67 |        1.67 |     1.61 |     1.74 |        0.09 |

### opcodes-memory

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.01 |        2.01 |     1.94 |     2.08 |        0.10 |
| REVM        |      1.43 |        1.43 |     1.36 |     1.50 |        0.10 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.58 |        1.58 |     1.52 |     1.63 |        0.08 |

### opcodes-push-pop

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.25 |        2.25 |     2.22 |     2.27 |        0.04 |
| REVM        |      1.55 |        1.55 |     1.51 |     1.58 |        0.05 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.54 |        1.54 |     1.52 |     1.57 |        0.04 |

### opcodes-storage-cold

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.81 |        1.81 |     1.80 |     1.82 |        0.01 |
| REVM        |      1.65 |        1.65 |     1.63 |     1.67 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.63 |        1.63 |     1.62 |     1.64 |        0.01 |

### opcodes-storage-warm

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.08 |        2.08 |     2.00 |     2.17 |        0.12 |
| REVM        |      2.05 |        2.05 |     2.01 |     2.09 |        0.06 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.62 |        1.62 |     1.59 |     1.65 |        0.04 |

### opcodes-swap

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.85 |        1.85 |     1.83 |     1.87 |        0.03 |
| REVM        |      1.65 |        1.65 |     1.63 |     1.68 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.61 |        1.61 |     1.56 |     1.65 |        0.07 |

### precompile-blake2f

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.19 |        2.19 |     2.12 |     2.26 |        0.10 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.38 |        4.38 |     4.24 |     4.53 |        0.21 |
| evmone      |      2.04 |        2.04 |     2.02 |     2.07 |        0.04 |

### precompile-bn256add

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.45 |        3.45 |     3.42 |     3.48 |        0.04 |
| REVM        |      2.96 |        2.96 |     2.21 |     3.70 |        1.05 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      5.35 |        5.35 |     5.02 |     5.69 |        0.47 |
| evmone      |      1.64 |        1.64 |     1.63 |     1.65 |        0.01 |

### precompile-bn256mul

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.91 |        2.91 |     2.40 |     3.43 |        0.73 |
| REVM        |      1.62 |        1.62 |     1.58 |     1.65 |        0.05 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      9.51 |        9.51 |     9.35 |     9.67 |        0.23 |
| evmone      |      1.93 |        1.93 |     1.87 |     1.98 |        0.08 |

### precompile-bn256pairing

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      4.92 |        4.92 |     4.90 |     4.95 |        0.03 |
| REVM        |      1.43 |        1.43 |     1.43 |     1.43 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |     13.03 |       13.03 |    12.92 |    13.15 |        0.17 |
| evmone      |      1.73 |        1.73 |     1.72 |     1.75 |        0.02 |

### precompile-ecrecover

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.14 |        2.14 |     2.08 |     2.21 |        0.09 |
| REVM        |      2.07 |        2.07 |     2.06 |     2.09 |        0.02 |
| EthereumJS  |    127.35 |      127.35 |   126.65 |   128.06 |        0.99 |
| Geth        |      4.72 |        4.72 |     4.65 |     4.80 |        0.11 |
| evmone      |      1.93 |        1.93 |     1.76 |     2.10 |        0.24 |

### precompile-identity

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      5.34 |        5.34 |     5.25 |     5.43 |        0.13 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.79 |        4.79 |     4.35 |     5.24 |        0.63 |
| evmone      |      2.15 |        2.15 |     2.10 |     2.20 |        0.07 |

### precompile-modexp

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.18 |        2.18 |     2.14 |     2.23 |        0.06 |
| REVM        |      1.95 |        1.95 |     1.63 |     2.26 |        0.45 |
| EthereumJS  |    117.17 |      117.17 |   116.85 |   117.49 |        0.45 |
| Geth        |      4.36 |        4.36 |     4.33 |     4.39 |        0.04 |
| evmone      |      1.59 |        1.59 |     1.58 |     1.61 |        0.02 |

### precompile-ripemd160

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.76 |        2.76 |     2.69 |     2.83 |        0.10 |
| REVM        |      1.58 |        1.58 |     1.49 |     1.67 |        0.13 |
| EthereumJS  |    111.18 |      111.18 |   110.67 |   111.68 |        0.71 |
| Geth        |      4.07 |        4.07 |     4.00 |     4.14 |        0.10 |
| evmone      |      2.55 |        2.55 |     2.40 |     2.70 |        0.21 |

### precompile-sha256

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.38 |        2.38 |     2.25 |     2.51 |        0.19 |
| REVM        |      1.48 |        1.48 |     1.47 |     1.49 |        0.02 |
| EthereumJS  |    118.28 |      118.28 |   115.33 |   121.23 |        4.18 |
| Geth        |      4.09 |        4.09 |     4.05 |     4.13 |        0.06 |
| evmone      |      1.92 |        1.92 |     1.85 |     1.99 |        0.09 |

## Overall Performance Summary

| Test Case | Guillotine (ms) | REVM (ms) | EthereumJS (ms) | Geth (ms) | evmone (ms) |
|-----------|-----------------|-----------|-----------|-----------|-------------|
| erc20-approval-transfer   |           14.41 |     11.83 |    767.52 |     25.47 |        1.57 |
| erc20-mint                |           11.20 |      9.76 |    786.73 |     24.74 |        1.58 |
| erc20-transfer            |           15.68 |     16.02 |   1024.63 |     33.15 |        1.69 |
| ten-thousand-hashes       |            8.16 |      4.81 |    545.77 |     15.52 |        1.57 |
| snailtracer               |          295.05 |     98.89 |   3043.87 |    225.62 |        1.75 |
| opcodes-arithmetic        |            1.85 |      1.71 |      0.00 |      0.00 |        1.59 |
| opcodes-arithmetic-advanced |            2.01 |      1.45 |      0.00 |      0.00 |        1.54 |
| opcodes-bitwise           |            2.05 |      1.39 |      0.00 |      0.00 |        1.55 |
| opcodes-block-1           |            2.58 |      0.00 |      0.00 |      4.45 |        2.28 |
| opcodes-block-2           |            2.50 |      0.00 |      0.00 |      4.46 |        2.12 |
| opcodes-comparison        |            2.46 |      1.45 |      0.00 |      0.00 |        1.62 |
| opcodes-control           |            4.83 |      0.00 |      0.00 |      4.67 |        7.30 |
| opcodes-crypto            |            2.74 |      1.99 |    134.78 |      4.50 |        1.67 |
| opcodes-data              |            3.37 |      1.64 |    128.92 |      4.40 |        3.71 |
| opcodes-dup               |            1.95 |      1.92 |      0.00 |      0.00 |        1.75 |
| opcodes-environmental-1   |            1.79 |      1.72 |      0.00 |      0.00 |        1.61 |
| opcodes-environmental-2   |            3.49 |      0.00 |      0.00 |      4.58 |        2.86 |
| opcodes-jump-basic        |            1.85 |      1.56 |    114.73 |      3.92 |        1.67 |
| opcodes-memory            |            2.01 |      1.43 |      0.00 |      0.00 |        1.58 |
| opcodes-push-pop          |            2.25 |      1.55 |      0.00 |      0.00 |        1.54 |
| opcodes-storage-cold      |            1.81 |      1.65 |      0.00 |      0.00 |        1.63 |
| opcodes-storage-warm      |            2.08 |      2.05 |      0.00 |      0.00 |        1.62 |
| opcodes-swap              |            1.85 |      1.65 |      0.00 |      0.00 |        1.61 |
| precompile-blake2f        |            2.19 |      0.00 |      0.00 |      4.38 |        2.04 |
| precompile-bn256add       |            3.45 |      2.96 |      0.00 |      5.35 |        1.64 |
| precompile-bn256mul       |            2.91 |      1.62 |      0.00 |      9.51 |        1.93 |
| precompile-bn256pairing   |            4.92 |      1.43 |      0.00 |     13.03 |        1.73 |
| precompile-ecrecover      |            2.14 |      2.07 |    127.35 |      4.72 |        1.93 |
| precompile-identity       |            5.34 |      0.00 |      0.00 |      4.79 |        2.15 |
| precompile-modexp         |            2.18 |      1.95 |    117.17 |      4.36 |        1.59 |
| precompile-ripemd160      |            2.76 |      1.58 |    111.18 |      4.07 |        2.55 |
| precompile-sha256         |            2.38 |      1.48 |    118.28 |      4.09 |        1.92 |

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
