# Viem vs Voltaire-Effect Comparison Summary

**Date**: 2026-01-25  
**Updated**: 2026-01-26
**Author**: Analysis based on viem WalletClient and Account abstractions

## Related Reviews (current files)

| Review | Focus | Status |
|--------|-------|--------|
| [081-jsonrpc-review.md](./081-jsonrpc-review.md) | JSON-RPC module | Open |
| [082-abi-primitives-review.md](./082-abi-primitives-review.md) | ABI encode/decode | Open (no tests) |
| [083-nonce-manager-gaps.md](./083-nonce-manager-gaps.md) | NonceManager | ✅ Core fixed |
| [085-effect-patterns-improvements.md](./085-effect-patterns-improvements.md) | Effect idioms | Partial |
| [093-receipt-eventlog-review.md](./093-receipt-eventlog-review.md) | Receipt/EventLog | P0 Open |
| [094-block-primitives-review.md](./094-block-primitives-review.md) | Block schemas | P1 Open |

**Completed & Deleted:**
- ~~010-add-transport-batching.md~~ - ✅ BatchScheduler implemented
- ~~040-fix-websocket-transport-effect-run-sync.md~~ - ✅ @effect/platform Socket

## Executive Summary

voltaire-effect provides a solid foundation with Effect-based APIs, but has significant gaps compared to viem's feature completeness. The main areas needing work are:

### 🔴 Critical Gaps

| Gap | Impact | Files |
|-----|--------|-------|
| ~~No EIP-7702 `signAuthorization`~~ | ✅ Fixed (signAuthorization + prepareAuthorization) | Signer |
| ~~No `stateOverride` in call~~ | ✅ Fixed (call + estimateGas support stateOverride) | Provider |
| ~~No `simulateCalls` with asset changes~~ | ✅ Fixed (simulateContract implemented) | Provider |
| Limited transport hooks (no onRequest/onResponse) | Hard to inject auth/metrics per request | Transport |
| ~~No chainId in NonceManager~~ | ✅ Fixed (chainId-scoped keys) | NonceManager |
| ~~No `addChain` wallet action~~ | ✅ Fixed (addChain + switchChain) | Signer |
| No chain formatters | L2 transactions miss fields | Chain |
| ~~No signature verification~~ | ✅ Fixed (verifyMessage, verifyTypedData, recoverAddress) | Crypto |

### 🟡 Important Gaps

| Gap | Impact | Files |
|-----|--------|-------|
| ~~No fallback transport ranking~~ | ✅ Fixed (latency ranking option) | Transport |
| ~~No HD derivation options~~ | ✅ Fixed (MnemonicAccount path/deriveChild/hdKey) | Account |
| No `sign({ hash })` on Account | Raw signing needed for protocols | Account |
| No filter-based subscriptions | No eth_newFilter support | Provider |
| ~~No ENS methods~~ | ✅ Fixed (getEnsAddress, getEnsName, getEnsText, getEnsAvatar) | Provider |
| ~~No multicall batching~~ | ✅ Fixed (Multicall3 + Provider action) | Provider |
| ~~No `watchAsset`, permissions~~ | ✅ Fixed (watchAsset, getPermissions, requestPermissions) | Signer |
| No `watchEvent` / `watchContractEvent` | Can't stream events | Provider, Contract |
| ~~No `deployContract` helper~~ | ✅ Fixed (deployContract action) | Signer |
| No SIWE support | Manual auth implementation | Auth |
| ~~No `getBlobBaseFee`~~ | ✅ Fixed (with fallback logic) | Provider |
| ~~No Contract.estimateGas~~ | ✅ Fixed (estimateGas.ts, needs index export) | Contract |

### 🟢 Good Coverage

| Feature | Notes |
|---------|-------|
| Transaction types 0-4 | Full support |
| EIP-191, EIP-712 signing | Full support |
| EIP-5792 wallet_sendCalls | Mostly complete |
| Core RPC methods | Most read methods |
| Effect-based architecture | Well designed |
| Stream-based block watching | Nice implementation |

## Priority Implementation Order

### Phase 1: Protocol Critical (Week 1-2)

1. **EIP-7702 Authorization** - Used on mainnet now
   - `AccountService.signAuthorization`
   - `SignerService.signAuthorization`
   - `SignerService.prepareAuthorization`

2. **State Override** - Simulation accuracy
   - `ProviderService.call({ stateOverride })`
   - `ProviderService.estimateGas({ stateOverride })`
   - `blockOverrides` support

3. **HttpTransport request hooks / fetchOptions** - Required for production
   - Headers, credentials, custom fetch

4. **Signature Verification** - Essential for auth
   - `verifyMessage`, `verifyTypedData`, `verifyHash`
   - `recoverAddress`, `recoverMessageAddress`

### Phase 2: Simulation & UX (Week 2-3)

5. **simulateCalls with asset changes** - "What will happen" UX
6. **Contract.estimateGas** - Per-method gas estimation
7. ✅ **NonceManager with chainId** - Multi-chain safety (implemented)
8. **Chain formatters** - L2 field support

### Phase 3: Wallet Actions (Week 3-4)

9. **addChain** - EIP-3085
10. **watchAsset** - EIP-747
11. **getPermissions/requestPermissions** - EIP-2255
12. **getAddresses** (non-prompting)
13. **deployContract** helper

### Phase 4: Account & Signing (Week 4-5)

14. **Account.sign({ hash })** - Raw hash signing
15. **Account.publicKey property** - Signature verification
16. ✅ **HD derivation options** - Child account derivation (implemented)
17. **toAccount factory** - Custom signing implementations
18. **ERC-6492 signature support** - Smart account counterfactual

### Phase 5: Subscriptions & Events (Week 5-6)

19. **watchEvent / watchContractEvent** - Event streaming
20. **Filter methods** - eth_newFilter, getFilterChanges
21. **watchPendingTransactions** - Mempool watching
22. ✅ **Fallback transport ranking** - Better reliability (implemented)

### Phase 6: Provider Completeness (Week 6-7)

23. **ENS methods** - getEnsAddress, etc.
24. ✅ **Multicall batching** - Automatic call aggregation (implemented)
25. **getBlobBaseFee** - EIP-4844
26. **SIWE support** - Sign-In with Ethereum

### Phase 7: Effect Polish (Ongoing)

27. **Effect.Schema for types**
28. **Effect.Request for batching**
29. **Effect.Config for configuration**
30. **Better resource management**

## Architecture Recommendations

### Don't Copy Viem

voltaire-effect should NOT be a 1:1 port of viem. Instead:

1. **Keep Effect idioms** - Layers, Services, Streams
2. **Add viem-missing features** - Request batching, typed schemas
3. **Modular composition** - Services compose via layers

### What Makes voltaire-effect Better

1. **Type-safe configuration** via layers
2. **Dependency injection** via Effect context
3. **Cancellation & timeouts** via Effect fibers
4. **Streaming** via Effect Streams
5. **Error handling** via typed errors

### What to Learn From Viem

1. **Extensibility** - Chain formatters, custom serializers
2. **Convenience** - Sync variants, contract helpers
3. **Completeness** - All wallet actions, all RPC methods
4. **L2 support** - Chain-specific handling

## Quick Wins (< 1 day each)

1. ✅ Add `addChain` to SignerService (implemented)
2. Add `getAddresses` to SignerService
3. Add `publicKey` property to LocalAccount
4. ✅ Add `chainId` parameter to NonceManager (implemented)
5. Add request/response hooks (or `fetchOptions`) to HttpTransport config
6. ✅ Add `getBlobBaseFee` to ProviderService (implemented)
7. Add `getTransactionConfirmations` to ProviderService
8. ✅ Export `hashMessage`, `hashTypedData` utilities (implemented)

## Metric Tracking

### Coverage Targets

| Category | Current | Target |
|----------|---------|--------|
| EIP compliance | ~85% | 90% |
| RPC methods | ~85% | 95% |
| Wallet actions | ~90% ✅ | 90% |
| L2 support | ~30% | 80% |
| Account types | ~60% | 80% |
| Signature utilities | ~95% ✅ | 90% |
| Simulation | ~85% | 80% ✅ |
| Event subscriptions | ~30% | 80% |

### Test Coverage Needs

- Add integration tests for each new action
- Add compatibility tests with viem expected behavior
- Add L2-specific tests (Optimism, Arbitrum formatting)
- Add signature verification tests
- Add simulation accuracy tests
