# Viem vs Voltaire-Effect Comparison Summary

**Date**: 2026-01-25
**Author**: Analysis based on viem WalletClient and Account abstractions

## Related Reviews

- [078-viem-walletclient-analysis.md](./078-viem-walletclient-analysis.md) - WalletClient configuration
- [079-viem-account-analysis.md](./079-viem-account-analysis.md) - Account types and capabilities
- [080-provider-signer-gaps.md](./080-provider-signer-gaps.md) - Missing RPC methods and actions
- [081-transport-configuration-gaps.md](./081-transport-configuration-gaps.md) - Transport options
- [082-chain-configuration-gaps.md](./082-chain-configuration-gaps.md) - Chain config for L2s
- [083-nonce-manager-gaps.md](./083-nonce-manager-gaps.md) - Nonce management
- [084-eip-compliance-gaps.md](./084-eip-compliance-gaps.md) - EIP support
- [085-effect-patterns-improvements.md](./085-effect-patterns-improvements.md) - Effect idioms

## Executive Summary

voltaire-effect provides a solid foundation with Effect-based APIs, but has significant gaps compared to viem's feature completeness. The main areas needing work are:

### 🔴 Critical Gaps

| Gap | Impact | Files |
|-----|--------|-------|
| No EIP-7702 `signAuthorization` | Can't create code delegations | Signer, Account |
| No `stateOverride` in call | Can't simulate accurately | Provider |
| No `fetchOptions` in HttpTransport | Can't add auth headers | Transport |
| No chainId in NonceManager | Multi-chain nonce collision | NonceManager |
| No `addChain` wallet action | Can't add chains to wallet | Signer |
| No chain formatters | L2 transactions miss fields | Chain |

### 🟡 Important Gaps

| Gap | Impact | Files |
|-----|--------|-------|
| No fallback transport ranking | Suboptimal RPC selection | Transport |
| No HD derivation options | Can't derive child accounts | Account |
| No `sign({ hash })` on Account | Raw signing needed for protocols | Account |
| No filter-based subscriptions | No eth_newFilter support | Provider |
| No ENS methods | No name resolution | Provider |
| No multicall batching | Inefficient batch reads | Provider |
| No `watchAsset`, permissions | Missing wallet UX | Signer |

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

3. **HttpTransport fetchOptions** - Required for production
   - Headers, credentials, custom fetch

### Phase 2: Multi-Chain (Week 2-3)

4. **NonceManager with chainId** - Multi-chain safety
5. **Chain formatters** - L2 field support
6. **Multiple RPC URLs** - Fallback support
7. **Fallback transport ranking** - Better reliability

### Phase 3: Wallet UX (Week 3-4)

8. **addChain** - EIP-3085
9. **watchAsset** - EIP-747
10. **getPermissions/requestPermissions** - EIP-2255
11. **getAddresses** (non-prompting)

### Phase 4: Account Features (Week 4-5)

12. **Account.sign({ hash })** - Raw hash signing
13. **Account.publicKey property** - Signature verification
14. **HD derivation options** - Child account derivation
15. **toAccount factory** - Custom signing implementations

### Phase 5: Provider Completeness (Week 5-6)

16. **Filter methods** - eth_newFilter, getFilterChanges
17. **ENS methods** - getEnsAddress, etc.
18. **Multicall batching** - Automatic call aggregation
19. **getBlobBaseFee** - EIP-4844

### Phase 6: Effect Polish (Ongoing)

20. **Effect.Schema for types**
21. **Effect.Request for batching**
22. **Effect.Config for configuration**
23. **Better resource management**

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

1. Add `addChain` to SignerService
2. Add `getAddresses` to SignerService
3. Add `publicKey` property to LocalAccount
4. Add `chainId` parameter to NonceManager
5. Add `fetchOptions` to HttpTransport config

## Metric Tracking

### Coverage Targets

| Category | Current | Target |
|----------|---------|--------|
| EIP compliance | ~65% | 90% |
| RPC methods | ~70% | 95% |
| Wallet actions | ~50% | 90% |
| L2 support | ~30% | 80% |
| Account types | ~40% | 80% |

### Test Coverage Needs

- Add integration tests for each new action
- Add compatibility tests with viem expected behavior
- Add L2-specific tests (Optimism, Arbitrum formatting)
