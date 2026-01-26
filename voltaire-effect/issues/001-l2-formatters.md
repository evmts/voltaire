# L2-Specific Formatters

**Priority**: P1
**Status**: Not Started

## Summary

L2 chain configs exist but lack chain-specific formatters. Need formatters for OP Stack, Arbitrum, zkSync.

## Gaps

### Optimism/Base (OP Stack)
- `depositNonce` field on transactions
- `isSystemTx` field on transactions
- L1 fee fields on receipts

### Arbitrum
- `gasUsedForL1` field
- `l1BlockNumber` field

### zkSync
- `l1BatchNumber` field
- `l1BatchTxIndex` field
- Custom transaction types

## Implementation

Create L2 formatter layers that extend DefaultFormatter:

```typescript
// src/services/Formatter/chains/optimism.ts
export const OptimismFormatter = Layer.succeed(FormatterService, {
  formatBlock: (rpc) => Effect.succeed(rpc),
  formatTransaction: (rpc) => Effect.succeed({
    ...rpc,
    depositNonce: rpc.depositNonce,
    isSystemTx: rpc.isSystemTx,
  }),
  formatReceipt: (rpc) => Effect.succeed({
    ...rpc,
    l1Fee: rpc.l1Fee,
    l1FeeScalar: rpc.l1FeeScalar,
  }),
  formatRequest: (tx) => Effect.succeed(tx),
})
```

## Files
- src/services/Formatter/chains/optimism.ts (NEW)
- src/services/Formatter/chains/arbitrum.ts (NEW)
- src/services/Formatter/chains/zksync.ts (NEW)
- src/services/Formatter/chains/index.ts (NEW)
