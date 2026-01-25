# Review: Fix EIP-1559 Fee Calculation

## Priority: 🔴 CRITICAL

## Summary

The EIP-1559 `maxFeePerGas` calculation uses a 2x multiplier instead of the standard 1.2x, causing users to overpay gas by ~67%.

## Problem

**File**: [Signer.ts#L209-L211](../src/services/Signer/Signer.ts#L209-L211)

```typescript
const multiplier = 2n;
const maxFeePerGas = tx.maxFeePerGas ?? baseFee * multiplier + maxPriorityFeePerGas;
```

### Issues:

1. **Wrong multiplier**: Uses `2n` (2x) instead of `1.2` (20% buffer)
2. **Wrong formula order**: Should be `baseFee * 1.2 + priority`, not `baseFee * 2 + priority`

### Comparison with viem:

```typescript
// viem - correct
const baseFeeMultiplier = chain?.fees?.baseFeeMultiplier ?? 1.2
const maxFeePerGas = baseFeePerGas * baseFeeMultiplier + maxPriorityFeePerGas
```

## Impact

- Users **overpay gas by ~67%** on every EIP-1559 transaction
- With baseFee=30 gwei, priority=2 gwei:
  - Current: `30 * 2 + 2 = 62 gwei` 
  - Correct: `30 * 1.2 + 2 = 38 gwei`

## Fix Required

1. Change multiplier from `2n` to fractional calculation
2. Since bigint doesn't support decimals, use: `baseFee + (baseFee / 5n) + maxPriorityFeePerGas`
3. Or use `(baseFee * 12n) / 10n + maxPriorityFeePerGas`

## Additional Enhancement

Consider making the multiplier configurable like viem does, potentially via chain config.

## Testing

Add test cases verifying:
- Default multiplier produces ~1.2x baseFee
- Custom multiplier can be specified
- Edge cases with very low/high base fees
