# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 3 (EthereumJS: 1)
**EVMs Compared**: Guillotine (Zig), REVM (Rust), EthereumJS (JavaScript), Geth (Go), evmone (C++)
**Timestamp**: 1754090243 (Unix epoch)

## Performance Comparison

### erc20-approval-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     30.19 |       30.13 |    30.09 |    30.34 |        0.13 |
| REVM        |     26.31 |       26.35 |    26.08 |    26.51 |        0.21 |
| EthereumJS  |   1654.77 |     1650.81 |  1645.50 |  1667.99 |       11.75 |
| Geth        |     52.87 |       52.90 |    52.82 |    52.90 |        0.05 |
| evmone      |      1.53 |        1.53 |     1.51 |     1.57 |        0.03 |

### erc20-mint

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     23.56 |       23.53 |    23.31 |    23.85 |        0.27 |
| REVM        |     20.86 |       20.84 |    20.69 |    21.05 |        0.18 |
| EthereumJS  |   1747.94 |     1746.12 |  1743.57 |  1754.11 |        5.50 |
| Geth        |     48.16 |       47.96 |    47.55 |    48.95 |        0.72 |
| evmone      |      1.59 |        1.58 |     1.56 |     1.62 |        0.03 |

### erc20-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     37.14 |       36.82 |    36.75 |    37.84 |        0.61 |
| REVM        |     33.64 |       33.59 |    33.40 |    33.93 |        0.27 |
| EthereumJS  |   2293.27 |     2283.36 |  2275.02 |  2321.43 |       24.74 |
| Geth        |     68.37 |       68.31 |    68.16 |    68.65 |        0.25 |
| evmone      |      1.59 |        1.59 |     1.57 |     1.61 |        0.02 |

### ten-thousand-hashes

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     15.26 |       15.30 |    14.94 |    15.54 |        0.30 |
| REVM        |      9.23 |        9.26 |     9.16 |     9.28 |        0.07 |
| EthereumJS  |   1118.51 |     1117.13 |  1099.24 |  1139.15 |       19.99 |
| Geth        |     28.41 |       28.17 |    28.16 |    28.90 |        0.42 |
| evmone      |      1.58 |        1.58 |     1.57 |     1.60 |        0.01 |

### snailtracer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |    940.84 |      941.38 |   938.34 |   942.78 |        2.27 |
| REVM        |    313.74 |      317.40 |   304.57 |   319.26 |        8.00 |
| EthereumJS  |   3008.47 |     3008.47 |  3008.47 |  3008.47 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.73 |        1.72 |     1.68 |     1.77 |        0.04 |

### opcodes-arithmetic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.83 |        1.84 |     1.79 |     1.86 |        0.04 |
| Guillotine  |      1.87 |        1.88 |     1.84 |     1.89 |        0.02 |
| REVM        |      1.42 |        1.42 |     1.41 |     1.42 |        0.01 |
| REVM        |      1.39 |        1.37 |     1.36 |     1.43 |        0.04 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.50 |        1.50 |     1.49 |     1.51 |        0.01 |
| evmone      |      1.58 |        1.58 |     1.57 |     1.60 |        0.02 |

### opcodes-arithmetic-advanced

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.83 |        1.84 |     1.79 |     1.86 |        0.04 |
| REVM        |      1.42 |        1.42 |     1.41 |     1.42 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.50 |        1.50 |     1.49 |     1.51 |        0.01 |

### opcodes-bitwise

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.84 |        1.86 |     1.79 |     1.86 |        0.04 |
| REVM        |      1.39 |        1.41 |     1.36 |     1.42 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.50 |        1.50 |     1.49 |     1.51 |        0.01 |

### opcodes-block-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.49 |        2.47 |     2.45 |     2.54 |        0.05 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      3.89 |        3.88 |     3.85 |     3.92 |        0.04 |
| evmone      |      2.22 |        2.23 |     2.16 |     2.26 |        0.05 |

### opcodes-block-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.35 |        2.34 |     2.30 |     2.40 |        0.05 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      3.73 |        3.70 |     3.70 |     3.78 |        0.05 |
| evmone      |      2.09 |        2.12 |     2.01 |     2.15 |        0.07 |

### opcodes-comparison

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.35 |        2.27 |     2.20 |     2.58 |        0.20 |
| REVM        |      1.37 |        1.37 |     1.36 |     1.37 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.56 |        1.58 |     1.51 |     1.60 |        0.05 |

### opcodes-control

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      4.00 |        4.02 |     3.72 |     4.26 |        0.27 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      5.00 |        4.98 |     4.85 |     5.17 |        0.16 |
| evmone      |      4.01 |        3.99 |     3.76 |     4.28 |        0.26 |

### opcodes-crypto

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.29 |        2.30 |     2.27 |     2.30 |        0.02 |
| REVM        |      1.85 |        1.84 |     1.83 |     1.89 |        0.03 |
| EthereumJS  |    134.12 |      134.15 |   133.10 |   135.11 |        1.00 |
| Geth        |      4.16 |        4.16 |     4.15 |     4.17 |        0.01 |
| evmone      |      1.74 |        1.74 |     1.72 |     1.76 |        0.02 |

### opcodes-data

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.96 |        2.95 |     2.86 |     3.06 |        0.10 |
| REVM        |      1.63 |        1.65 |     1.60 |     1.66 |        0.03 |
| EthereumJS  |    126.14 |      125.55 |   125.43 |   127.43 |        1.12 |
| Geth        |      4.29 |        4.28 |     4.25 |     4.35 |        0.05 |
| evmone      |      2.55 |        2.57 |     2.40 |     2.67 |        0.14 |

### opcodes-dup

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.86 |        1.85 |     1.85 |     1.88 |        0.02 |
| REVM        |      1.39 |        1.39 |     1.38 |     1.41 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.56 |        1.56 |     1.52 |     1.60 |        0.04 |

### opcodes-environmental-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.81 |        1.83 |     1.77 |     1.83 |        0.03 |
| REVM        |      1.38 |        1.40 |     1.31 |     1.41 |        0.05 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.58 |        1.57 |     1.57 |     1.61 |        0.03 |

### opcodes-environmental-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.72 |        2.72 |     2.68 |     2.75 |        0.04 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.48 |        4.50 |     4.27 |     4.66 |        0.20 |
| evmone      |      2.52 |        2.51 |     2.51 |     2.54 |        0.02 |

### opcodes-jump-basic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.81 |        1.81 |     1.80 |     1.82 |        0.01 |
| REVM        |      1.37 |        1.37 |     1.37 |     1.38 |        0.00 |
| EthereumJS  |    111.74 |      112.44 |   110.09 |   112.70 |        1.44 |
| Geth        |      3.42 |        3.43 |     3.37 |     3.45 |        0.04 |
| evmone      |      1.54 |        1.52 |     1.51 |     1.58 |        0.04 |

### opcodes-memory

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.89 |        1.90 |     1.83 |     1.92 |        0.05 |
| REVM        |      1.39 |        1.41 |     1.36 |     1.42 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.54 |        1.54 |     1.52 |     1.57 |        0.02 |

### opcodes-push-pop

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.02 |        2.00 |     1.96 |     2.10 |        0.07 |
| REVM        |      1.35 |        1.35 |     1.34 |     1.36 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.60 |        1.60 |     1.59 |     1.61 |        0.01 |

### opcodes-storage-cold

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.89 |        1.90 |     1.87 |     1.90 |        0.02 |
| REVM        |      1.40 |        1.40 |     1.39 |     1.42 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.56 |        1.54 |     1.52 |     1.64 |        0.06 |

### opcodes-storage-warm

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.89 |        1.90 |     1.86 |     1.92 |        0.03 |
| REVM        |      1.39 |        1.39 |     1.38 |     1.40 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.54 |        1.54 |     1.52 |     1.56 |        0.02 |

### opcodes-swap

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.82 |        1.80 |     1.79 |     1.86 |        0.04 |
| REVM        |      1.40 |        1.38 |     1.37 |     1.43 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.56 |        1.58 |     1.51 |     1.58 |        0.04 |

### precompile-blake2f

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.19 |        2.19 |     2.16 |     2.23 |        0.03 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      3.57 |        3.56 |     3.54 |     3.60 |        0.03 |
| evmone      |      2.01 |        2.02 |     1.99 |     2.02 |        0.02 |

### precompile-bn256add

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.29 |        3.29 |     3.28 |     3.30 |        0.01 |
| REVM        |      1.71 |        1.71 |     1.70 |     1.73 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.16 |        4.18 |     4.11 |     4.19 |        0.05 |
| evmone      |      1.58 |        1.58 |     1.57 |     1.58 |        0.01 |

### precompile-bn256mul

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      9.67 |        9.69 |     9.60 |     9.72 |        0.06 |
| REVM        |      1.58 |        1.57 |     1.55 |     1.62 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      8.54 |        8.51 |     8.47 |     8.63 |        0.08 |
| evmone      |      1.88 |        1.83 |     1.81 |     1.99 |        0.10 |

### precompile-bn256pairing

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |    182.09 |      182.36 |   181.43 |   182.48 |        0.57 |
| REVM        |      1.38 |        1.37 |     1.36 |     1.41 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |     12.03 |       12.06 |    11.83 |    12.19 |        0.18 |
| evmone      |      1.54 |        1.51 |     1.50 |     1.60 |        0.05 |

### precompile-ecrecover

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.14 |        2.15 |     2.09 |     2.18 |        0.04 |
| REVM        |      1.72 |        1.72 |     1.71 |     1.74 |        0.02 |
| EthereumJS  |    129.87 |      129.45 |   129.14 |   131.01 |        1.00 |
| Geth        |      3.83 |        3.74 |     3.73 |     4.01 |        0.16 |
| evmone      |      1.71 |        1.71 |     1.69 |     1.74 |        0.02 |

### precompile-identity

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      5.35 |        5.34 |     5.27 |     5.43 |        0.08 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      3.87 |        3.86 |     3.84 |     3.91 |        0.03 |
| evmone      |      2.01 |        2.00 |     2.00 |     2.02 |        0.01 |

### precompile-modexp

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.09 |        2.09 |     2.09 |     2.09 |        0.00 |
| REVM        |      1.44 |        1.39 |     1.39 |     1.54 |        0.08 |
| EthereumJS  |    119.15 |      119.67 |   117.70 |   120.06 |        1.26 |
| Geth        |      3.44 |        3.44 |     3.43 |     3.45 |        0.01 |
| evmone      |      1.57 |        1.56 |     1.55 |     1.59 |        0.02 |

### precompile-ripemd160

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.46 |        2.40 |     2.32 |     2.66 |        0.18 |
| REVM        |      1.49 |        1.50 |     1.46 |     1.52 |        0.03 |
| EthereumJS  |    111.17 |      110.86 |   110.48 |   112.17 |        0.89 |
| Geth        |      3.94 |        3.91 |     3.74 |     4.17 |        0.22 |
| evmone      |      2.14 |        2.17 |     2.04 |     2.21 |        0.09 |

### precompile-sha256

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.98 |        1.99 |     1.97 |     1.99 |        0.01 |
| REVM        |      1.46 |        1.45 |     1.45 |     1.47 |        0.01 |
| EthereumJS  |    110.98 |      111.60 |   109.15 |   112.19 |        1.62 |
| Geth        |      4.22 |        4.23 |     3.88 |     4.55 |        0.34 |
| evmone      |      1.70 |        1.71 |     1.67 |     1.73 |        0.03 |

## Overall Performance Summary

| Test Case | Guillotine (ms) | REVM (ms) | EthereumJS (ms) | Geth (ms) | evmone (ms) |
|-----------|-----------------|-----------|-----------|-----------|-------------|
| erc20-approval-transfer   |           30.19 |     26.31 |   1654.77 |     52.87 |        1.53 |
| erc20-mint                |           23.56 |     20.86 |   1747.94 |     48.16 |        1.59 |
| erc20-transfer            |           37.14 |     33.64 |   2293.27 |     68.37 |        1.59 |
| ten-thousand-hashes       |           15.26 |      9.23 |   1118.51 |     28.41 |        1.58 |
| snailtracer               |          940.84 |    313.74 |   3008.47 |      0.00 |        1.73 |
| opcodes-arithmetic        |            1.87 |      1.39 |      0.00 |      0.00 |        1.58 |
| opcodes-arithmetic-advanced |            1.83 |      1.42 |      0.00 |      0.00 |        1.50 |
| opcodes-bitwise           |            1.84 |      1.39 |      0.00 |      0.00 |        1.50 |
| opcodes-block-1           |            2.49 |      0.00 |      0.00 |      3.89 |        2.22 |
| opcodes-block-2           |            2.35 |      0.00 |      0.00 |      3.73 |        2.09 |
| opcodes-comparison        |            2.35 |      1.37 |      0.00 |      0.00 |        1.56 |
| opcodes-control           |            4.00 |      0.00 |      0.00 |      5.00 |        4.01 |
| opcodes-crypto            |            2.29 |      1.85 |    134.12 |      4.16 |        1.74 |
| opcodes-data              |            2.96 |      1.63 |    126.14 |      4.29 |        2.55 |
| opcodes-dup               |            1.86 |      1.39 |      0.00 |      0.00 |        1.56 |
| opcodes-environmental-1   |            1.81 |      1.38 |      0.00 |      0.00 |        1.58 |
| opcodes-environmental-2   |            2.72 |      0.00 |      0.00 |      4.48 |        2.52 |
| opcodes-jump-basic        |            1.81 |      1.37 |    111.74 |      3.42 |        1.54 |
| opcodes-memory            |            1.89 |      1.39 |      0.00 |      0.00 |        1.54 |
| opcodes-push-pop          |            2.02 |      1.35 |      0.00 |      0.00 |        1.60 |
| opcodes-storage-cold      |            1.89 |      1.40 |      0.00 |      0.00 |        1.56 |
| opcodes-storage-warm      |            1.89 |      1.39 |      0.00 |      0.00 |        1.54 |
| opcodes-swap              |            1.82 |      1.40 |      0.00 |      0.00 |        1.56 |
| precompile-blake2f        |            2.19 |      0.00 |      0.00 |      3.57 |        2.01 |
| precompile-bn256add       |            3.29 |      1.71 |      0.00 |      4.16 |        1.58 |
| precompile-bn256mul       |            9.67 |      1.58 |      0.00 |      8.54 |        1.88 |
| precompile-bn256pairing   |          182.09 |      1.38 |      0.00 |     12.03 |        1.54 |
| precompile-ecrecover      |            2.14 |      1.72 |    129.87 |      3.83 |        1.71 |
| precompile-identity       |            5.35 |      0.00 |      0.00 |      3.87 |        2.01 |
| precompile-modexp         |            2.09 |      1.44 |    119.15 |      3.44 |        1.57 |
| precompile-ripemd160      |            2.46 |      1.49 |    111.17 |      3.94 |        2.14 |
| precompile-sha256         |            1.98 |      1.46 |    110.98 |      4.22 |        1.70 |

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
