# Layer Composition Patterns Review

**Date**: 2026-01-25  
**Files Reviewed**: CryptoLive.ts, CryptoTest.ts, presets/index.ts, services/index.ts, all *Service.ts files  
**Severity Scale**: Critical | High | Medium | Low | Info

---

## Executive Summary

The Effect Layer composition across voltaire-effect services is **mostly well-designed** with consistent patterns. The codebase demonstrates good use of `Layer.effect`, `Layer.succeed`, and `Layer.mergeAll`. However, there are several issues ranging from missing test layers to inconsistent dependency declarations that should be addressed.

**Key Findings**:
- 2 Critical issues (missing test layers cause asymmetry)
- 3 High issues (dependency declarations, preset duplication)
- 4 Medium issues (layer type inconsistencies)
- 3 Low/Info observations

---

## 1. Layer.effect vs Layer.succeed Usage

### ✅ Correct Patterns Observed

| Service | Pattern | Notes |
|---------|---------|-------|
| `DefaultFormatter` | `Layer.succeed` | No dependencies, pure values |
| `DefaultCcip` | `Layer.succeed` | Stateless HTTP-based impl |
| `DefaultAbiEncoder` | `Layer.succeed` | Pure functions, no deps |
| `DefaultTransactionSerializer.Live` | `Layer.succeed` | Pure, uses voltaire core |
| `NoopKzg` | `Layer.succeed` | Stub that always fails |
| `Bls12381Live` | `Layer.succeed` | Pure crypto operations |

| Service | Pattern | Notes |
|---------|---------|-------|
| `Provider` | `Layer.effect` | Requires TransportService |
| `Signer.Live` | `Layer.effect` | Requires Account, Provider, Transport |
| `DefaultMulticall` | `Layer.effect` | Requires ProviderService |
| `DefaultFeeEstimator` | `Layer.effect` | Requires ProviderService |
| `DefaultNonceManager` | `Layer.effect` | Stateful (SynchronizedRef) |

### 🔴 Issue: DefaultNonceManager Type Declaration Mismatch

**Severity**: Medium  
**Location**: `services/NonceManager/DefaultNonceManager.ts:77`

```typescript
// Current - declares no requirements but methods require ProviderService at runtime
export const DefaultNonceManager: Layer.Layer<NonceManagerService> =
  Layer.effect(...)
```

The layer type declares `Layer.Layer<NonceManagerService>` (no requirements), but the internal methods (`get`, `consume`) yield `ProviderService`. This works because the methods return Effects with `ProviderService` in their `R` type, but it's confusing.

**Recommendation**: Either:
1. Document that ProviderService is a "deferred" dependency (provided at method call time), or
2. Change the service shape to not require ProviderService in method return types

---

## 2. Service Dependency Declarations

### ✅ Correct Dependency Typing

```typescript
// Provider.ts - correctly declares TransportService dependency
export const Provider: Layer.Layer<ProviderService, never, TransportService>

// DefaultMulticall.ts - correctly declares ProviderService dependency  
export const DefaultMulticall: Layer.Layer<MulticallService, never, ProviderService>

// DefaultFeeEstimator.ts - correctly declares ProviderService dependency
export const DefaultFeeEstimator: Layer.Layer<FeeEstimatorService, never, ProviderService>
```

### 🔴 Issue: Signer.Live Missing Type Declaration

**Severity**: High  
**Location**: `services/Signer/Signer.ts:244-584`

The `SignerLive` layer has implicit dependencies but the export lacks explicit type annotation:

```typescript
// Current - SignerLive type is inferred
const SignerLive = Layer.effect(SignerService, Effect.gen(function* () {
  const account = yield* AccountService;
  const provider = yield* ProviderService;
  const transport = yield* TransportService;
  // ...
}));
```

**Recommendation**: Add explicit type annotation:
```typescript
const SignerLive: Layer.Layer<
  SignerService,
  never,
  AccountService | ProviderService | TransportService
> = Layer.effect(...)
```

---

## 3. Layer.provide vs Layer.provideMerge Patterns

### ✅ Correct Usage in Presets

```typescript
// presets/index.ts - proper use of Layer.provide for composition
export const MainnetProvider = (url: string): Layer.Layer<ProviderService> =>
  Provider.pipe(Layer.provide(HttpTransport(url)));
```

### ✅ Correct Documentation Pattern

```typescript
// NonceManager docs show correct composition
* const MainnetNonceManager = DefaultNonceManager.pipe(
*   Layer.provideMerge(Provider),
*   Layer.provide(HttpTransport('https://...'))
* )
```

### 🔴 Issue: Preset Duplication

**Severity**: High  
**Location**: `services/presets/index.ts:132-264`

The preset provider functions (`OptimismProvider`, `ArbitrumProvider`, `BaseProvider`, `SepoliaProvider`, `PolygonProvider`, `MainnetFullProvider`) have nearly identical implementations:

```typescript
// Repeated 6 times with only chain config difference
export const OptimismProvider = (url: string): Layer.Layer<ComposedServices> => {
  const transport = HttpTransport(url);
  const providerLayer = Provider.pipe(Layer.provide(transport));
  return Layer.mergeAll(
    providerLayer,
    DefaultFormatter,
    DefaultTransactionSerializer.Live,
    DefaultFeeEstimator.pipe(Layer.provide(providerLayer)),
    DefaultNonceManager.pipe(Layer.provide(providerLayer)),
    MemoryCache(),
    optimism,  // <-- Only difference
  );
};
```

**Recommendation**: Extract common factory:
```typescript
const createChainProvider = (
  url: string,
  chainLayer: Layer.Layer<ChainService>
): Layer.Layer<ComposedServices> => {
  const transport = HttpTransport(url);
  const providerLayer = Provider.pipe(Layer.provide(transport));
  return Layer.mergeAll(
    providerLayer,
    DefaultFormatter,
    DefaultTransactionSerializer.Live,
    DefaultFeeEstimator.pipe(Layer.provide(providerLayer)),
    DefaultNonceManager.pipe(Layer.provide(providerLayer)),
    MemoryCache(),
    chainLayer,
  );
};

export const OptimismProvider = (url: string) => createChainProvider(url, optimism);
export const ArbitrumProvider = (url: string) => createChainProvider(url, arbitrum);
// etc.
```

---

## 4. Circular Dependency Risks

### ✅ No Circular Dependencies Detected

The dependency graph is acyclic:

```
TransportService (leaf)
    ↓
ProviderService
    ↓
SignerService ← AccountService (leaf)
    ↓
FeeEstimatorService, NonceManagerService, MulticallService
```

**Observation**: The architecture properly separates:
- **Leaf services**: TransportService, AccountService, FormatterService, ChainService, CacheService, AbiEncoderService
- **Dependent services**: ProviderService → TransportService
- **Composite services**: SignerService → Provider + Account + Transport

---

## 5. Test Layer Completeness

### 🔴 Critical: CryptoTest Missing Layers

**Severity**: Critical  
**Location**: `crypto/CryptoTest.ts`

`CryptoLive` includes 16 services but `CryptoTest` only includes 14:

| Service | In CryptoLive | In CryptoTest |
|---------|---------------|---------------|
| Bls12381 | ✅ `Bls12381Live` | ❌ **Missing** |
| P256 | ✅ `P256Live` | ❌ **Missing** |
| Keccak | ✅ | ✅ |
| Secp256k1 | ✅ | ✅ |
| SHA256 | ✅ | ✅ |
| Blake2 | ✅ | ✅ |
| Ripemd160 | ✅ | ✅ |
| Ed25519 | ✅ | ✅ |
| KZG | ✅ | ✅ |
| HDWallet | ✅ | ✅ |
| Bn254 | ✅ | ✅ |
| Bip39 | ✅ | ✅ |
| HMAC | ✅ | ✅ |
| EIP712 | ✅ | ✅ |
| ChaCha20Poly1305 | ✅ | ✅ |
| Keystore | ✅ | ✅ |

**Impact**: Tests using `CryptoTest` that need BLS12-381 or P256 will fail with missing service errors.

**Fix Required**:
```typescript
// CryptoTest.ts - add missing imports and layers
import { Bls12381Test } from "./Bls12381/index.js";
import { P256Test } from "./P256/index.js";

export const CryptoTest = Layer.mergeAll(
  // ... existing ...
  Bls12381Test,  // Add
  P256Test,      // Add
);
```

### 🔴 Critical: Missing Service Test Layers

**Severity**: Critical  

Several services lack test layer implementations:

| Service | Has Live/Default | Has Test/Mock |
|---------|------------------|---------------|
| MulticallService | ✅ DefaultMulticall | ❌ None |
| BlockStreamService | ✅ BlockStream | ❌ None |
| FeeEstimatorService | ✅ DefaultFeeEstimator | ❌ None |
| NonceManagerService | ✅ DefaultNonceManager | ❌ None |
| RawProviderService | ✅ RawProviderTransport | ❌ None |

**Recommendation**: Create test layers that return deterministic values:
```typescript
// Example: TestFeeEstimator
export const TestFeeEstimator = Layer.succeed(FeeEstimatorService, {
  estimateFeesPerGas: (type) => 
    type === 'legacy'
      ? Effect.succeed({ gasPrice: 20_000_000_000n })
      : Effect.succeed({ maxFeePerGas: 30_000_000_000n, maxPriorityFeePerGas: 1_000_000_000n }),
  getMaxPriorityFeePerGas: () => Effect.succeed(1_000_000_000n),
  baseFeeMultiplier: 1.2,
});
```

---

## 6. Live Layer Completeness

### ✅ All Services Have Live Implementations

| Category | Services | Live Layer |
|----------|----------|------------|
| Transport | TransportService | HttpTransport, WebSocketTransport, BrowserTransport |
| Provider | ProviderService | Provider |
| Signer | SignerService | Signer.Live |
| Account | AccountService | LocalAccount, JsonRpcAccount |
| Crypto (16) | All | CryptoLive |
| Utilities | Cache, Chain, Formatter, etc. | All present |

### 🟡 Medium: Inconsistent Naming Convention

**Severity**: Medium

Mixed naming patterns for live layers:

| Pattern | Examples |
|---------|----------|
| `*Live` | `Bls12381Live`, `KeccakLive`, `Provider` (implied) |
| `Default*` | `DefaultMulticall`, `DefaultFeeEstimator`, `DefaultFormatter` |
| `Namespace.Live` | `Signer.Live`, `DefaultTransactionSerializer.Live` |
| Factory | `HttpTransport(url)`, `LocalAccount(key)`, `MemoryCache()` |

**Recommendation**: Standardize on one pattern. Suggested hierarchy:
- `*Live` for basic implementations
- `Default*` for opinionated defaults
- Factory functions for configurable layers

---

## 7. Default Layer Exports

### ✅ Proper Re-exports in Index Files

`services/index.ts` correctly re-exports all layers:

```typescript
export { Provider, ProviderService, ProviderError } from "./Provider/index.js";
export { DefaultMulticall, MulticallService } from "./Multicall/index.js";
export { DefaultFeeEstimator, FeeEstimatorService } from "./FeeEstimator/index.js";
// ... etc
```

### 🟡 Medium: Missing Convenience Layers Export

**Severity**: Low  
**Location**: `services/index.ts`

No convenience "batteries-included" layer that combines all common services:

```typescript
// Missing: A combined services layer similar to CryptoLive
export const ServicesLive = Layer.mergeAll(
  DefaultFormatter,
  DefaultTransactionSerializer.Live,
  DefaultAbiEncoder,
  DefaultCcip,
  NoopKzg,
);
```

---

## 8. Additional Findings

### 🟡 Transport Factory Layers

**Observation**: Transport layers use factory functions which is correct:

```typescript
HttpTransport(url: string): Layer.Layer<TransportService>
WebSocketTransport(url: string): Layer.Layer<TransportService, never, Scope>
TestTransport(responses): Layer.Layer<TransportService>
```

### 🟡 FeeEstimator Precision Loss

**Already Tracked**: Review 044 covers `Number()` precision loss in base fee multiplication.

### ✅ Good: Error Channel Consistency

All layers consistently use `never` for error channel when errors are handled internally.

---

## Summary of Required Actions

### Critical (Must Fix)
1. **Add Bls12381Test and P256Test to CryptoTest** - Breaks test symmetry
2. **Create test layers for Multicall, BlockStream, FeeEstimator, NonceManager, RawProvider**

### High Priority
3. **Add explicit type annotations to Signer.Live** - Improves code clarity
4. **Refactor preset duplication** - DRY principle violation

### Medium Priority  
5. **Document or fix DefaultNonceManager deferred dependency pattern**
6. **Standardize layer naming conventions**
7. **Consider adding ServicesLive convenience layer**

### Low Priority
8. **Add inline comments explaining Layer.provide vs Layer.provideMerge usage**

---

## Appendix: Layer Dependency Graph

```
                    ┌──────────────┐
                    │TransportService│
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌────────────┐
    │ Provider │    │RawProvider│    │ Signer     │
    └────┬─────┘    └──────────┘    └──────┬─────┘
         │                                  │
    ┌────┴────────┬──────────────────┬─────┘
    │             │                  │
    ▼             ▼                  ▼
┌─────────┐ ┌───────────┐ ┌──────────────┐
│Multicall│ │FeeEstimator│ │NonceManager  │
└─────────┘ └───────────┘ └──────────────┘

Independent Layers (no deps):
- FormatterService (DefaultFormatter)
- ChainService (mainnet, sepolia, etc.)
- CacheService (MemoryCache, NoopCache)
- AbiEncoderService (DefaultAbiEncoder)
- CcipService (DefaultCcip, NoopCcip)
- KzgService (DefaultKzg, NoopKzg)
- TransactionSerializerService (DefaultTransactionSerializer.Live)
- All Crypto services (CryptoLive)
```
