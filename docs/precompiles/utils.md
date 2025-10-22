# Utilities

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Overview

The `utils.zig` module provides utility functions shared across multiple precompile implementations. Currently contains the MSM (Multi-Scalar Multiplication) discount table used by BLS12-381 MSM operations.

## Functions

### msmDiscount

Calculates the discount factor for multi-scalar multiplication operations based on the number of point-scalar pairs.

```zig
pub fn msmDiscount(k: usize) u64
```

**Parameters:**
- `k: usize` - Number of point-scalar pairs in the MSM operation

**Returns:**
- `u64` - Discount factor (multiplied by 1000 for precision)

**Purpose:**
Multi-scalar multiplication benefits from batch processing. The discount factor rewards larger batches with lower per-pair gas costs, reflecting the computational savings from Pippenger's algorithm.

## Discount Table

Based on EIP-2537, the discount table provides sub-linear scaling:

| Pairs (k) | Discount | Description |
|-----------|----------|-------------|
| 1         | 1000     | No discount (single operation) |
| 2-3       | 820      | 18% discount |
| 4-7       | 580      | 42% discount |
| 8-15      | 430      | 57% discount |
| 16-31     | 320      | 68% discount |
| 32-63     | 250      | 75% discount |
| 64-127    | 200      | 80% discount |
| 128+      | 174      | 82.6% discount (maximum) |

## Usage

The discount factor is used in gas cost calculations for MSM operations:

```zig
const k = input.len / pair_size;
const discount = utils.msmDiscount(k);
const gas_cost = (base_gas * k * discount) / 1000;
```

## Example

```zig
const utils = @import("precompiles").utils;

// Calculate discount for 10 pairs
const discount = utils.msmDiscount(10);
// discount = 430 (57% discount)

// Calculate gas for G1 MSM with 10 pairs
const base_gas = 12000;
const k = 10;
const gas_cost = (base_gas * k * discount) / 1000;
// gas_cost = (12000 * 10 * 430) / 1000 = 51,600 gas
```

## Discount Rationale

The discount structure reflects:
1. **Algorithmic Efficiency:** Pippenger's algorithm scales sub-linearly
2. **Batch Overhead:** Fixed setup costs amortized over more operations
3. **Incentive Structure:** Encourages batching for gas efficiency

## Used By

This utility is used by:
- **BLS12_G1MSM (0x0D):** G1 multi-scalar multiplication
- **BLS12_G2MSM (0x10):** G2 multi-scalar multiplication

## Implementation Details

The function uses a simple if-else chain for efficiency:

```zig
pub fn msmDiscount(k: usize) u64 {
    return if (k >= 128)
        174
    else if (k >= 64)
        200
    else if (k >= 32)
        250
    else if (k >= 16)
        320
    else if (k >= 8)
        430
    else if (k >= 4)
        580
    else if (k >= 2)
        820
    else
        1000;
}
```

## Testing

The module includes comprehensive tests validating all discount table entries:

```zig
test "msmDiscount - discount table" {
    const testing = std.testing;

    try testing.expectEqual(@as(u64, 1000), msmDiscount(1));
    try testing.expectEqual(@as(u64, 820), msmDiscount(2));
    try testing.expectEqual(@as(u64, 580), msmDiscount(4));
    try testing.expectEqual(@as(u64, 430), msmDiscount(8));
    try testing.expectEqual(@as(u64, 320), msmDiscount(16));
    try testing.expectEqual(@as(u64, 250), msmDiscount(32));
    try testing.expectEqual(@as(u64, 200), msmDiscount(64));
    try testing.expectEqual(@as(u64, 174), msmDiscount(128));
}
```

## Gas Savings Examples

Comparing individual operations vs MSM for k pairs:

**G1 Operations (12,000 gas base):**
- k=4: Individual: 48,000 gas, MSM: 27,840 gas (42% savings)
- k=8: Individual: 96,000 gas, MSM: 51,600 gas (46% savings)
- k=16: Individual: 192,000 gas, MSM: 61,440 gas (68% savings)
- k=128: Individual: 1,536,000 gas, MSM: 267,264 gas (83% savings)

**G2 Operations (45,000 gas base):**
- k=4: Individual: 180,000 gas, MSM: 104,400 gas (42% savings)
- k=8: Individual: 360,000 gas, MSM: 193,500 gas (46% savings)
- k=16: Individual: 720,000 gas, MSM: 230,400 gas (68% savings)
- k=128: Individual: 5,760,000 gas, MSM: 1,002,240 gas (83% savings)

## Notes

- Discount values are integers representing per-mille (1/1000)
- Division by 1000 in gas calculation maintains precision
- Maximum discount is 826 per-mille (82.6%) at k=128+
- Table values derived from EIP-2537 specification
