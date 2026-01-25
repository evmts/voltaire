# Fix FeeEstimator BigInt Precision Loss

## Problem

DefaultFeeEstimator converts bigint to Number for multiplication, causing precision loss for large gas prices.

**Location**: `src/services/FeeEstimator/DefaultFeeEstimator.ts#L107-L110`

```typescript
const multipliedBaseFee = BigInt(Math.ceil(Number(baseFee) * baseFeeMultiplier));
//                                          ^^^^^^^^^^^^^^
//                                          Precision loss for baseFee > 2^53!
```

## Why This Matters

- JavaScript Number only has 53 bits of precision
- baseFee can exceed 2^53 wei (9007 Gwei) during congestion
- Incorrect fee estimation leads to stuck transactions
- Silent corruption - no error, just wrong value

## Solution

Use bigint-only math:

```typescript
// For 1.2x multiplier (20% buffer):
const multipliedBaseFee = (baseFee * 12n) / 10n;

// For configurable multiplier, use basis points:
const MULTIPLIER_BPS = 12000n;  // 1.2x = 12000 basis points
const multipliedBaseFee = (baseFee * MULTIPLIER_BPS) / 10000n;

// Or use a helper:
function multiplyBigInt(value: bigint, multiplier: number): bigint {
  const bps = BigInt(Math.round(multiplier * 10000));
  return (value * bps) / 10000n;
}
```

## Acceptance Criteria

- [ ] Remove `Number()` conversion for baseFee
- [ ] Use bigint arithmetic for multiplication
- [ ] Handle configurable multiplier with basis points
- [ ] Add test with baseFee > 2^53
- [ ] All existing tests pass

## Priority

**Medium** - Correctness for high gas prices
