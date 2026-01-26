# Viem vs Voltaire-Effect Comparison

**Updated**: 2026-01-26

## Coverage Summary

| Category | Coverage | Notes |
|----------|----------|-------|
| Transport Layer | 100% | HttpTransport, WebSocketTransport, FallbackTransport |
| Provider Core | 95% | All major RPC methods |
| Wallet/Signer | 100% | All wallet actions |
| Account System | 95% | Missing toAccount factory |
| Signature Utils | 100% | verifyMessage, verifyTypedData, recoverAddress |
| ENS Support | 100% | getEnsAddress, getEnsName, getEnsText, getEnsAvatar |
| SIWE Support | 100% | Full implementation |
| Unit Utilities | 100% | parseEther, formatEther, etc. |
| L2 Chain Config | 60% | Configs exist, formatters missing |
| Stream Subscriptions | 100% | EventStream, TransactionStream, BlockStream |

## Verified Implementations

- **EventStream.watch()** - Stream-based event watching
- **EventStream.backfill()** - Historical event fetching
- **TransactionStream.watchPending()** - Mempool watching
- **TransactionStream.watchConfirmed()** - Confirmed tx watching
- **TransactionStream.track()** - Track specific tx lifecycle

## Remaining Gaps

### P1 - L2 Formatters
L2 chain configs exist but lack formatters for chain-specific fields:
- Optimism: depositNonce, isSystemTx, l1Fee
- Arbitrum: gasUsedForL1, l1BlockNumber
- zkSync: l1BatchNumber, l1BatchTxIndex

### P2 - Account Extensions
- toAccount factory for custom signers
- ERC-6492 signature wrapping for smart accounts

## What Makes voltaire-effect Better Than viem

1. **Type-safe configuration** via Effect Layers
2. **Dependency injection** via Effect Context
3. **Cancellation & timeouts** via Effect Fibers
4. **Streaming** via Effect Streams (EventStream, TransactionStream, BlockStream)
5. **Error handling** via typed errors
6. **Request batching** via BatchScheduler
