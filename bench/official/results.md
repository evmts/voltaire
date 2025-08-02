# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 3 (EthereumJS: 1)
**EVMs Compared**: Guillotine (Zig), REVM (Rust), EthereumJS (JavaScript), Geth (Go), evmone (C++)
**Timestamp**: 1754109567 (Unix epoch)

## Performance Comparison

### erc20-approval-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     19.46 |       19.45 |    19.33 |    19.59 |        0.13 |
| REVM        |     17.27 |       17.23 |    17.08 |    17.50 |        0.21 |
| EthereumJS  |   1083.75 |     1085.51 |  1077.82 |  1087.92 |        5.27 |
| Geth        |     35.62 |       35.66 |    34.69 |    36.50 |        0.90 |
| evmone      |      1.67 |        1.67 |     1.65 |     1.69 |        0.02 |

### erc20-mint

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     14.89 |       14.86 |    14.86 |    14.96 |        0.05 |
| REVM        |     14.08 |       14.05 |    14.00 |    14.19 |        0.10 |
| EthereumJS  |   1145.83 |     1134.90 |  1122.80 |  1179.79 |       30.03 |
| Geth        |     31.07 |       31.09 |    30.50 |    31.61 |        0.55 |
| evmone      |      1.67 |        1.67 |     1.66 |     1.69 |        0.01 |

### erc20-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     22.71 |       22.69 |    22.67 |    22.76 |        0.05 |
| REVM        |     21.62 |       21.54 |    21.29 |    22.04 |        0.38 |
| EthereumJS  |   1487.02 |     1487.60 |  1478.89 |  1494.57 |        7.86 |
| Geth        |     44.48 |       44.64 |    43.96 |    44.85 |        0.46 |
| evmone      |      1.65 |        1.66 |     1.63 |     1.67 |        0.02 |

### ten-thousand-hashes

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      9.63 |        9.68 |     9.54 |     9.68 |        0.08 |
| REVM        |      6.70 |        6.75 |     6.60 |     6.76 |        0.09 |
| EthereumJS  |    728.74 |      730.58 |   723.56 |   732.06 |        4.54 |
| Geth        |     19.36 |       19.35 |    19.08 |    19.65 |        0.29 |
| evmone      |      1.80 |        1.71 |     1.68 |     2.02 |        0.19 |

### snailtracer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |    521.42 |      520.85 |   519.63 |   523.77 |        2.13 |
| REVM        |    177.80 |      177.72 |   177.58 |   178.12 |        0.28 |
| EthereumJS  |   3081.12 |     3081.12 |  3081.12 |  3081.12 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.81 |        1.81 |     1.80 |     1.82 |        0.01 |

### opcodes-arithmetic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.97 |        1.97 |     1.95 |     2.00 |        0.03 |
| Guillotine  |      2.00 |        1.99 |     1.97 |     2.03 |        0.03 |
| REVM        |      1.51 |        1.51 |     1.51 |     1.51 |        0.00 |
| REVM        |      1.50 |        1.50 |     1.49 |     1.51 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.87 |        1.93 |     1.63 |     2.04 |        0.21 |
| evmone      |      1.76 |        1.72 |     1.67 |     1.89 |        0.12 |

### opcodes-arithmetic-advanced

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.97 |        1.97 |     1.95 |     2.00 |        0.03 |
| REVM        |      1.51 |        1.51 |     1.51 |     1.51 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.87 |        1.93 |     1.63 |     2.04 |        0.21 |

### opcodes-bitwise

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.00 |        1.99 |     1.99 |     2.02 |        0.02 |
| REVM        |      1.51 |        1.51 |     1.49 |     1.52 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.64 |        1.64 |     1.63 |     1.66 |        0.01 |

### opcodes-block-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.94 |        2.93 |     2.92 |     2.98 |        0.03 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.22 |        4.18 |     4.12 |     4.35 |        0.12 |
| evmone      |      2.32 |        2.31 |     2.31 |     2.33 |        0.01 |

### opcodes-block-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.73 |        2.73 |     2.69 |     2.77 |        0.04 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.23 |        4.22 |     4.07 |     4.39 |        0.16 |
| evmone      |      2.18 |        2.18 |     2.16 |     2.20 |        0.02 |

### opcodes-comparison

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.97 |        1.98 |     1.94 |     1.98 |        0.02 |
| REVM        |      1.54 |        1.54 |     1.53 |     1.56 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.66 |        1.66 |     1.60 |     1.71 |        0.06 |

### opcodes-control

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.38 |        3.36 |     3.23 |     3.54 |        0.16 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.16 |        4.18 |     4.10 |     4.20 |        0.05 |
| evmone      |      2.61 |        2.60 |     2.59 |     2.62 |        0.02 |

### opcodes-crypto

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.56 |        2.55 |     2.54 |     2.58 |        0.02 |
| REVM        |      2.01 |        2.01 |     1.99 |     2.02 |        0.01 |
| EthereumJS  |    136.37 |      136.00 |   135.68 |   137.44 |        0.94 |
| Geth        |      4.36 |        4.37 |     4.29 |     4.42 |        0.06 |
| evmone      |      1.86 |        1.86 |     1.84 |     1.88 |        0.02 |

### opcodes-data

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.53 |        2.52 |     2.51 |     2.55 |        0.02 |
| REVM        |      1.86 |        1.85 |     1.77 |     1.95 |        0.09 |
| EthereumJS  |    128.44 |      128.58 |   126.82 |   129.92 |        1.55 |
| Geth        |      3.77 |        3.77 |     3.74 |     3.80 |        0.03 |
| evmone      |      1.94 |        1.93 |     1.93 |     1.97 |        0.02 |

### opcodes-dup

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.00 |        2.00 |     1.99 |     2.00 |        0.01 |
| REVM        |      1.52 |        1.52 |     1.51 |     1.53 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.71 |        1.69 |     1.59 |     1.84 |        0.13 |

### opcodes-environmental-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.98 |        1.98 |     1.97 |     1.99 |        0.01 |
| REVM        |      1.50 |        1.50 |     1.50 |     1.52 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.97 |        1.94 |     1.77 |     2.21 |        0.22 |

### opcodes-environmental-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.31 |        3.28 |     3.27 |     3.37 |        0.06 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.25 |        4.23 |     4.18 |     4.34 |        0.08 |
| evmone      |      2.65 |        2.64 |     2.54 |     2.76 |        0.11 |

### opcodes-jump-basic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.96 |        1.95 |     1.94 |     1.98 |        0.02 |
| REVM        |      1.48 |        1.48 |     1.47 |     1.49 |        0.01 |
| EthereumJS  |    113.20 |      113.03 |   112.99 |   113.57 |        0.32 |
| Geth        |      3.86 |        3.85 |     3.81 |     3.92 |        0.05 |
| evmone      |      1.64 |        1.62 |     1.61 |     1.68 |        0.04 |

### opcodes-memory

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.97 |        1.97 |     1.96 |     1.99 |        0.01 |
| REVM        |      1.52 |        1.52 |     1.50 |     1.54 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.72 |        1.67 |     1.65 |     1.84 |        0.10 |

### opcodes-push-pop

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.00 |        1.99 |     1.98 |     2.02 |        0.02 |
| REVM        |      1.57 |        1.56 |     1.55 |     1.61 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.66 |        1.66 |     1.63 |     1.69 |        0.03 |

### opcodes-storage-cold

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.94 |        1.94 |     1.93 |     1.95 |        0.01 |
| REVM        |      1.56 |        1.53 |     1.51 |     1.63 |        0.06 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.79 |        1.74 |     1.72 |     1.91 |        0.10 |

### opcodes-storage-warm

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.95 |        1.94 |     1.92 |     2.00 |        0.04 |
| REVM        |      1.50 |        1.50 |     1.48 |     1.52 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.66 |        1.67 |     1.60 |     1.70 |        0.05 |

### opcodes-swap

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.01 |        2.03 |     1.96 |     2.05 |        0.04 |
| REVM        |      1.52 |        1.52 |     1.50 |     1.52 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.93 |        1.98 |     1.79 |     2.01 |        0.12 |

### precompile-blake2f

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.55 |        2.54 |     2.53 |     2.58 |        0.03 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.11 |        4.16 |     3.87 |     4.31 |        0.22 |
| evmone      |      2.10 |        2.10 |     2.09 |     2.12 |        0.01 |

### precompile-bn256add

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.58 |        3.59 |     3.56 |     3.59 |        0.02 |
| REVM        |      1.83 |        1.86 |     1.77 |     1.86 |        0.05 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.37 |        4.37 |     4.34 |     4.39 |        0.03 |
| evmone      |      1.69 |        1.66 |     1.66 |     1.76 |        0.06 |

### precompile-bn256mul

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.26 |        2.26 |     2.24 |     2.27 |        0.02 |
| REVM        |      1.73 |        1.73 |     1.71 |     1.75 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      8.48 |        8.42 |     8.41 |     8.61 |        0.11 |
| evmone      |      1.67 |        1.67 |     1.67 |     1.68 |        0.01 |

### precompile-bn256pairing

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      5.07 |        5.06 |     5.06 |     5.10 |        0.02 |
| REVM        |      1.61 |        1.59 |     1.55 |     1.67 |        0.06 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |     13.00 |       12.73 |    12.56 |    13.72 |        0.63 |
| evmone      |      1.65 |        1.63 |     1.63 |     1.68 |        0.03 |

### precompile-ecrecover

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.34 |        2.34 |     2.34 |     2.34 |        0.00 |
| REVM        |      1.90 |        1.90 |     1.89 |     1.91 |        0.01 |
| EthereumJS  |    130.42 |      129.80 |   129.46 |   131.99 |        1.37 |
| Geth        |      3.98 |        3.97 |     3.96 |     4.00 |        0.02 |
| evmone      |      1.88 |        1.86 |     1.81 |     1.97 |        0.08 |

### precompile-identity

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      5.97 |        5.92 |     5.86 |     6.12 |        0.14 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.17 |        4.14 |     4.02 |     4.35 |        0.16 |
| evmone      |      2.08 |        2.07 |     2.06 |     2.10 |        0.02 |

### precompile-modexp

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.31 |        2.31 |     2.30 |     2.33 |        0.02 |
| REVM        |      1.54 |        1.55 |     1.53 |     1.55 |        0.01 |
| EthereumJS  |    118.90 |      118.47 |   118.24 |   119.99 |        0.95 |
| Geth        |      3.74 |        3.74 |     3.69 |     3.79 |        0.05 |
| evmone      |      1.75 |        1.74 |     1.66 |     1.85 |        0.10 |

### precompile-ripemd160

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.23 |        2.25 |     2.20 |     2.25 |        0.03 |
| REVM        |      1.61 |        1.61 |     1.60 |     1.62 |        0.01 |
| EthereumJS  |    113.22 |      113.24 |   112.55 |   113.89 |        0.67 |
| Geth        |      3.67 |        3.68 |     3.61 |     3.72 |        0.06 |
| evmone      |      1.85 |        1.84 |     1.82 |     1.90 |        0.04 |

### precompile-sha256

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.19 |        2.19 |     2.19 |     2.20 |        0.01 |
| REVM        |      1.62 |        1.61 |     1.60 |     1.64 |        0.02 |
| EthereumJS  |    112.00 |      111.72 |   111.69 |   112.59 |        0.51 |
| Geth        |      3.70 |        3.70 |     3.66 |     3.74 |        0.04 |
| evmone      |      1.88 |        1.87 |     1.85 |     1.91 |        0.03 |

## Overall Performance Summary

| Test Case | Guillotine (ms) | REVM (ms) | EthereumJS (ms) | Geth (ms) | evmone (ms) |
|-----------|-----------------|-----------|-----------|-----------|-------------|
| erc20-approval-transfer   |           19.46 |     17.27 |   1083.75 |     35.62 |        1.67 |
| erc20-mint                |           14.89 |     14.08 |   1145.83 |     31.07 |        1.67 |
| erc20-transfer            |           22.71 |     21.62 |   1487.02 |     44.48 |        1.65 |
| ten-thousand-hashes       |            9.63 |      6.70 |    728.74 |     19.36 |        1.80 |
| snailtracer               |          521.42 |    177.80 |   3081.12 |      0.00 |        1.81 |
| opcodes-arithmetic        |            2.00 |      1.50 |      0.00 |      0.00 |        1.76 |
| opcodes-arithmetic-advanced |            1.97 |      1.51 |      0.00 |      0.00 |        1.87 |
| opcodes-bitwise           |            2.00 |      1.51 |      0.00 |      0.00 |        1.64 |
| opcodes-block-1           |            2.94 |      0.00 |      0.00 |      4.22 |        2.32 |
| opcodes-block-2           |            2.73 |      0.00 |      0.00 |      4.23 |        2.18 |
| opcodes-comparison        |            1.97 |      1.54 |      0.00 |      0.00 |        1.66 |
| opcodes-control           |            3.38 |      0.00 |      0.00 |      4.16 |        2.61 |
| opcodes-crypto            |            2.56 |      2.01 |    136.37 |      4.36 |        1.86 |
| opcodes-data              |            2.53 |      1.86 |    128.44 |      3.77 |        1.94 |
| opcodes-dup               |            2.00 |      1.52 |      0.00 |      0.00 |        1.71 |
| opcodes-environmental-1   |            1.98 |      1.50 |      0.00 |      0.00 |        1.97 |
| opcodes-environmental-2   |            3.31 |      0.00 |      0.00 |      4.25 |        2.65 |
| opcodes-jump-basic        |            1.96 |      1.48 |    113.20 |      3.86 |        1.64 |
| opcodes-memory            |            1.97 |      1.52 |      0.00 |      0.00 |        1.72 |
| opcodes-push-pop          |            2.00 |      1.57 |      0.00 |      0.00 |        1.66 |
| opcodes-storage-cold      |            1.94 |      1.56 |      0.00 |      0.00 |        1.79 |
| opcodes-storage-warm      |            1.95 |      1.50 |      0.00 |      0.00 |        1.66 |
| opcodes-swap              |            2.01 |      1.52 |      0.00 |      0.00 |        1.93 |
| precompile-blake2f        |            2.55 |      0.00 |      0.00 |      4.11 |        2.10 |
| precompile-bn256add       |            3.58 |      1.83 |      0.00 |      4.37 |        1.69 |
| precompile-bn256mul       |            2.26 |      1.73 |      0.00 |      8.48 |        1.67 |
| precompile-bn256pairing   |            5.07 |      1.61 |      0.00 |     13.00 |        1.65 |
| precompile-ecrecover      |            2.34 |      1.90 |    130.42 |      3.98 |        1.88 |
| precompile-identity       |            5.97 |      0.00 |      0.00 |      4.17 |        2.08 |
| precompile-modexp         |            2.31 |      1.54 |    118.90 |      3.74 |        1.75 |
| precompile-ripemd160      |            2.23 |      1.61 |    113.22 |      3.67 |        1.85 |
| precompile-sha256         |            2.19 |      1.62 |    112.00 |      3.70 |        1.88 |

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
