# EVM Benchmark Comparison Results

## Summary

**Test Runs per Case**: 3 (EthereumJS: 1)
**EVMs Compared**: Guillotine (Zig), REVM (Rust), EthereumJS (JavaScript), Geth (Go), evmone (C++)
**Timestamp**: 1754099390 (Unix epoch)

## Performance Comparison

### erc20-approval-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     58.80 |       58.67 |    58.56 |    59.16 |        0.32 |
| REVM        |     51.78 |       51.83 |    51.50 |    52.03 |        0.27 |
| EthereumJS  |   3157.30 |     3158.33 |  3148.90 |  3164.68 |        7.94 |
| Geth        |    100.71 |      100.74 |   100.14 |   101.27 |        0.57 |
| evmone      |      1.48 |        1.48 |     1.47 |     1.51 |        0.02 |

### erc20-mint

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     44.61 |       44.54 |    44.49 |    44.80 |        0.17 |
| REVM        |     40.41 |       40.46 |    39.33 |    41.44 |        1.06 |
| EthereumJS  |   3309.30 |     3310.04 |  3301.69 |  3316.16 |        7.26 |
| Geth        |     89.16 |       88.30 |    88.17 |    91.00 |        1.60 |
| evmone      |      1.51 |        1.49 |     1.48 |     1.58 |        0.05 |

### erc20-transfer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     70.56 |       70.57 |    70.42 |    70.69 |        0.14 |
| REVM        |     65.60 |       65.67 |    65.19 |    65.94 |        0.38 |
| EthereumJS  |   4429.79 |     4426.15 |  4419.88 |  4443.35 |       12.15 |
| Geth        |    130.88 |      130.89 |   130.86 |   130.89 |        0.01 |
| evmone      |      1.55 |        1.54 |     1.51 |     1.61 |        0.05 |

### ten-thousand-hashes

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     28.10 |       27.99 |    27.81 |    28.52 |        0.37 |
| REVM        |     17.35 |       17.27 |    17.25 |    17.55 |        0.17 |
| EthereumJS  |   2049.09 |     2057.87 |  2023.66 |  2065.74 |       22.37 |
| Geth        |     50.68 |       50.62 |    50.58 |    50.82 |        0.13 |
| evmone      |      1.50 |        1.50 |     1.50 |     1.51 |        0.01 |

### snailtracer

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |   1966.85 |     1968.74 |  1962.90 |  1968.90 |        3.42 |
| REVM        |    674.38 |      678.73 |   662.32 |   682.09 |       10.58 |
| EthereumJS  |   2996.18 |     2996.18 |  2996.18 |  2996.18 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.76 |        1.73 |     1.72 |     1.83 |        0.06 |

### opcodes-arithmetic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.91 |        1.91 |     1.86 |     1.96 |        0.05 |
| Guillotine  |      1.86 |        1.88 |     1.83 |     1.88 |        0.03 |
| REVM        |      1.48 |        1.48 |     1.45 |     1.52 |        0.03 |
| REVM        |      1.42 |        1.40 |     1.39 |     1.46 |        0.04 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.47 |        1.44 |     1.42 |     1.54 |        0.07 |
| evmone      |      1.48 |        1.48 |     1.46 |     1.50 |        0.02 |

### opcodes-arithmetic-advanced

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.91 |        1.91 |     1.86 |     1.96 |        0.05 |
| REVM        |      1.48 |        1.48 |     1.45 |     1.52 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.47 |        1.44 |     1.42 |     1.54 |        0.07 |

### opcodes-bitwise

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.86 |        1.88 |     1.82 |     1.89 |        0.04 |
| REVM        |      1.43 |        1.42 |     1.42 |     1.44 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.48 |        1.48 |     1.45 |     1.52 |        0.03 |

### opcodes-block-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.62 |        2.63 |     2.50 |     2.72 |        0.11 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      3.78 |        3.79 |     3.76 |     3.80 |        0.02 |
| evmone      |      2.18 |        2.21 |     2.13 |     2.21 |        0.05 |

### opcodes-block-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.57 |        2.56 |     2.48 |     2.67 |        0.09 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      3.66 |        3.66 |     3.57 |     3.76 |        0.09 |
| evmone      |      2.01 |        2.01 |     1.99 |     2.02 |        0.02 |

### opcodes-comparison

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.91 |        1.92 |     1.89 |     1.94 |        0.03 |
| REVM        |      1.41 |        1.40 |     1.39 |     1.43 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.50 |        1.49 |     1.49 |     1.51 |        0.01 |

### opcodes-control

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.15 |        3.14 |     3.09 |     3.22 |        0.06 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      3.91 |        3.90 |     3.88 |     3.96 |        0.04 |
| evmone      |      3.90 |        3.83 |     3.69 |     4.19 |        0.26 |

### opcodes-crypto

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.31 |        2.30 |     2.27 |     2.35 |        0.04 |
| REVM        |      1.92 |        1.90 |     1.90 |     1.97 |        0.04 |
| EthereumJS  |    134.88 |      134.22 |   133.11 |   137.32 |        2.18 |
| Geth        |      4.11 |        4.11 |     4.03 |     4.18 |        0.08 |
| evmone      |      1.66 |        1.66 |     1.64 |     1.68 |        0.02 |

### opcodes-data

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.34 |        2.34 |     2.33 |     2.35 |        0.01 |
| REVM        |      1.71 |        1.70 |     1.69 |     1.74 |        0.03 |
| EthereumJS  |    126.29 |      125.73 |   125.70 |   127.44 |        1.00 |
| Geth        |      3.68 |        3.66 |     3.64 |     3.74 |        0.05 |
| evmone      |      2.30 |        2.33 |     2.14 |     2.42 |        0.15 |

### opcodes-dup

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.89 |        1.86 |     1.85 |     1.95 |        0.05 |
| REVM        |      1.43 |        1.43 |     1.42 |     1.45 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.46 |        1.47 |     1.42 |     1.49 |        0.04 |

### opcodes-environmental-1

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.83 |        1.83 |     1.81 |     1.85 |        0.02 |
| REVM        |      1.41 |        1.41 |     1.40 |     1.42 |        0.01 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.48 |        1.48 |     1.47 |     1.51 |        0.02 |

### opcodes-environmental-2

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.67 |        2.67 |     2.63 |     2.71 |        0.04 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      3.94 |        3.94 |     3.87 |     4.02 |        0.08 |
| evmone      |      2.43 |        2.43 |     2.39 |     2.48 |        0.04 |

### opcodes-jump-basic

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.10 |        2.08 |     2.01 |     2.19 |        0.09 |
| REVM        |      1.40 |        1.41 |     1.35 |     1.44 |        0.05 |
| EthereumJS  |    112.58 |      112.66 |   111.54 |   113.54 |        1.00 |
| Geth        |      3.34 |        3.32 |     3.31 |     3.38 |        0.04 |
| evmone      |      1.47 |        1.48 |     1.45 |     1.49 |        0.02 |

### opcodes-memory

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.91 |        1.91 |     1.90 |     1.92 |        0.01 |
| REVM        |      1.50 |        1.46 |     1.46 |     1.57 |        0.07 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.47 |        1.46 |     1.45 |     1.49 |        0.02 |

### opcodes-push-pop

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.01 |        1.99 |     1.98 |     2.07 |        0.05 |
| REVM        |      1.49 |        1.49 |     1.42 |     1.56 |        0.07 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.50 |        1.50 |     1.48 |     1.51 |        0.02 |

### opcodes-storage-cold

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.92 |        1.93 |     1.91 |     1.93 |        0.01 |
| REVM        |      1.42 |        1.44 |     1.35 |     1.45 |        0.05 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.45 |        1.45 |     1.43 |     1.47 |        0.02 |

### opcodes-storage-warm

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.80 |        1.80 |     1.77 |     1.82 |        0.02 |
| REVM        |      1.43 |        1.42 |     1.39 |     1.48 |        0.05 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.48 |        1.48 |     1.45 |     1.53 |        0.04 |

### opcodes-swap

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.91 |        1.93 |     1.84 |     1.95 |        0.06 |
| REVM        |      1.39 |        1.39 |     1.38 |     1.42 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| evmone      |      1.51 |        1.50 |     1.48 |     1.54 |        0.03 |

### precompile-blake2f

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.21 |        2.22 |     2.18 |     2.22 |        0.02 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      3.58 |        3.59 |     3.53 |     3.63 |        0.05 |
| evmone      |      1.97 |        1.97 |     1.93 |     2.00 |        0.04 |

### precompile-bn256add

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      3.35 |        3.36 |     3.27 |     3.42 |        0.08 |
| REVM        |      1.73 |        1.73 |     1.69 |     1.76 |        0.03 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      4.09 |        4.09 |     4.01 |     4.16 |        0.07 |
| evmone      |      1.50 |        1.50 |     1.50 |     1.51 |        0.01 |

### precompile-bn256mul

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |     10.04 |       10.09 |     9.93 |    10.10 |        0.10 |
| REVM        |      1.68 |        1.65 |     1.63 |     1.76 |        0.07 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      8.10 |        8.10 |     7.98 |     8.23 |        0.13 |
| evmone      |      1.65 |        1.65 |     1.63 |     1.67 |        0.02 |

### precompile-bn256pairing

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |    181.74 |      181.08 |   181.04 |   183.11 |        1.18 |
| REVM        |      1.47 |        1.47 |     1.45 |     1.48 |        0.02 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |     11.84 |       11.83 |    11.79 |    11.90 |        0.06 |
| evmone      |      1.47 |        1.46 |     1.44 |     1.50 |        0.03 |

### precompile-ecrecover

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.59 |        2.59 |     2.51 |     2.67 |        0.08 |
| REVM        |      1.77 |        1.78 |     1.76 |     1.78 |        0.01 |
| EthereumJS  |    129.40 |      129.30 |   129.11 |   129.78 |        0.35 |
| Geth        |      3.59 |        3.60 |     3.53 |     3.64 |        0.06 |
| evmone      |      1.64 |        1.63 |     1.63 |     1.66 |        0.02 |

### precompile-identity

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      5.34 |        5.31 |     5.29 |     5.42 |        0.07 |
| REVM        |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| EthereumJS  |      0.00 |        0.00 |     0.00 |     0.00 |        0.00 |
| Geth        |      3.64 |        3.67 |     3.59 |     3.67 |        0.05 |
| evmone      |      1.91 |        1.91 |     1.89 |     1.92 |        0.01 |

### precompile-modexp

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.10 |        2.11 |     2.06 |     2.11 |        0.03 |
| REVM        |      1.42 |        1.43 |     1.42 |     1.43 |        0.01 |
| EthereumJS  |    120.53 |      121.01 |   119.33 |   121.27 |        1.05 |
| Geth        |      3.34 |        3.36 |     3.31 |     3.36 |        0.03 |
| evmone      |      1.49 |        1.50 |     1.46 |     1.52 |        0.03 |

### precompile-ripemd160

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      2.08 |        2.07 |     2.02 |     2.15 |        0.06 |
| REVM        |      1.52 |        1.51 |     1.50 |     1.55 |        0.03 |
| EthereumJS  |    112.89 |      112.31 |   112.23 |   114.13 |        1.07 |
| Geth        |      3.43 |        3.44 |     3.41 |     3.45 |        0.02 |
| evmone      |      2.05 |        2.04 |     2.03 |     2.07 |        0.02 |

### precompile-sha256

| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
|-----|-----------|-------------|----------|----------|-------------|
| Guillotine  |      1.95 |        1.96 |     1.91 |     1.99 |        0.04 |
| REVM        |      1.50 |        1.50 |     1.48 |     1.52 |        0.02 |
| EthereumJS  |    111.75 |      111.71 |   111.19 |   112.36 |        0.58 |
| Geth        |      3.36 |        3.37 |     3.30 |     3.40 |        0.05 |
| evmone      |      1.72 |        1.73 |     1.69 |     1.74 |        0.03 |

## Overall Performance Summary

| Test Case | Guillotine (ms) | REVM (ms) | EthereumJS (ms) | Geth (ms) | evmone (ms) |
|-----------|-----------------|-----------|-----------|-----------|-------------|
| erc20-approval-transfer   |           58.80 |     51.78 |   3157.30 |    100.71 |        1.48 |
| erc20-mint                |           44.61 |     40.41 |   3309.30 |     89.16 |        1.51 |
| erc20-transfer            |           70.56 |     65.60 |   4429.79 |    130.88 |        1.55 |
| ten-thousand-hashes       |           28.10 |     17.35 |   2049.09 |     50.68 |        1.50 |
| snailtracer               |         1966.85 |    674.38 |   2996.18 |      0.00 |        1.76 |
| opcodes-arithmetic        |            1.86 |      1.42 |      0.00 |      0.00 |        1.48 |
| opcodes-arithmetic-advanced |            1.91 |      1.48 |      0.00 |      0.00 |        1.47 |
| opcodes-bitwise           |            1.86 |      1.43 |      0.00 |      0.00 |        1.48 |
| opcodes-block-1           |            2.62 |      0.00 |      0.00 |      3.78 |        2.18 |
| opcodes-block-2           |            2.57 |      0.00 |      0.00 |      3.66 |        2.01 |
| opcodes-comparison        |            1.91 |      1.41 |      0.00 |      0.00 |        1.50 |
| opcodes-control           |            3.15 |      0.00 |      0.00 |      3.91 |        3.90 |
| opcodes-crypto            |            2.31 |      1.92 |    134.88 |      4.11 |        1.66 |
| opcodes-data              |            2.34 |      1.71 |    126.29 |      3.68 |        2.30 |
| opcodes-dup               |            1.89 |      1.43 |      0.00 |      0.00 |        1.46 |
| opcodes-environmental-1   |            1.83 |      1.41 |      0.00 |      0.00 |        1.48 |
| opcodes-environmental-2   |            2.67 |      0.00 |      0.00 |      3.94 |        2.43 |
| opcodes-jump-basic        |            2.10 |      1.40 |    112.58 |      3.34 |        1.47 |
| opcodes-memory            |            1.91 |      1.50 |      0.00 |      0.00 |        1.47 |
| opcodes-push-pop          |            2.01 |      1.49 |      0.00 |      0.00 |        1.50 |
| opcodes-storage-cold      |            1.92 |      1.42 |      0.00 |      0.00 |        1.45 |
| opcodes-storage-warm      |            1.80 |      1.43 |      0.00 |      0.00 |        1.48 |
| opcodes-swap              |            1.91 |      1.39 |      0.00 |      0.00 |        1.51 |
| precompile-blake2f        |            2.21 |      0.00 |      0.00 |      3.58 |        1.97 |
| precompile-bn256add       |            3.35 |      1.73 |      0.00 |      4.09 |        1.50 |
| precompile-bn256mul       |           10.04 |      1.68 |      0.00 |      8.10 |        1.65 |
| precompile-bn256pairing   |          181.74 |      1.47 |      0.00 |     11.84 |        1.47 |
| precompile-ecrecover      |            2.59 |      1.77 |    129.40 |      3.59 |        1.64 |
| precompile-identity       |            5.34 |      0.00 |      0.00 |      3.64 |        1.91 |
| precompile-modexp         |            2.10 |      1.42 |    120.53 |      3.34 |        1.49 |
| precompile-ripemd160      |            2.08 |      1.52 |    112.89 |      3.43 |        2.05 |
| precompile-sha256         |            1.95 |      1.50 |    111.75 |      3.36 |        1.72 |

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
