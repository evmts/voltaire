# Review 096: Layer Composition Patterns

<issue>
<metadata>
priority: P1
files: [
  "voltaire-effect/src/crypto/CryptoLive.ts",
  "voltaire-effect/src/crypto/CryptoTest.ts",
  "voltaire-effect/src/services/presets/index.ts",
  "voltaire-effect/src/services/index.ts",
  "voltaire-effect/src/services/Provider/Provider.ts",
  "voltaire-effect/src/services/Signer/Signer.ts",
  "voltaire-effect/src/services/NonceManager/DefaultNonceManager.ts",
  "voltaire-effect/src/services/FeeEstimator/DefaultFeeEstimator.ts",
  "voltaire-effect/src/services/Multicall/DefaultMulticall.ts"
]
reviews: []
</metadata>

<module_overview>
<purpose>
Effect Layer composition patterns across voltaire-effect services. Covers Layer.effect vs Layer.succeed usage, dependency declarations, preset composition, test layer completeness, and service graph structure.
</purpose>
<current_status>
**MOSTLY WELL-DESIGNED** with consistent patterns. The codebase demonstrates good use of `Layer.effect`, `Layer.succeed`, and `Layer.mergeAll`. However, there are **2 Critical** and **3 High** issues around missing test layers and preset duplication that break the symmetry between live and test environments.
</current_status>
</module_overview>

<findings>
<critical>
### 1. CryptoTest Missing Bls12381 and P256 Layers (P0)

**Location**: `crypto/CryptoTest.ts`

`CryptoLive` includes 16 services but `CryptoTest` only includes 14. Missing:
- `Bls12381Test` - BLS12-381 signature test mocks
- `P256Test` - P-256 ECDSA test mocks

```typescript
// CryptoLive includes:
Bls12381Live, P256Live  // ✅ Present

// CryptoTest MISSING:
// Bls12381Test, P256Test  // ❌ Not included
```

**Impact**: Tests using `CryptoTest` that need BLS12-381 or P256 fail with missing service errors.

### 2. Service Test Layers Missing (P0)

Several services lack test layer implementations:

| Service | Has Live/Default | Has Test/Mock |
|---------|------------------|---------------|
| MulticallService | ✅ DefaultMulticall | ❌ None |
| BlockStreamService | ✅ BlockStream | ❌ None |
| FeeEstimatorService | ✅ DefaultFeeEstimator | ❌ None |
| NonceManagerService | ✅ DefaultNonceManager | ❌ None |
| RawProviderService | ✅ RawProviderTransport | ❌ None |

**Impact**: Cannot unit test code that depends on these services without network calls.

</critical>
<high>
### 3. Signer.Live Missing Type Declaration (P1)

**Location**: `services/Signer/Signer.ts:244-584`

The `SignerLive` layer has implicit dependencies but lacks explicit type annotation:

```typescript
// Current - SignerLive type is inferred
const SignerLive = Layer.effect(SignerService, Effect.gen(function* () {
  const account = yield* AccountService;
  const provider = yield* ProviderService;
  const transport = yield* TransportService;
  // ...
}));
```

**Impact**: Type inference may miss dependencies, confusing consumers.

### 4. Preset Duplication (P1)

**Location**: `services/presets/index.ts:132-264`

Six preset provider functions (`OptimismProvider`, `ArbitrumProvider`, `BaseProvider`, `SepoliaProvider`, `PolygonProvider`, `MainnetFullProvider`) have nearly identical implementations with only chain config difference.

**Impact**: DRY violation, 6x maintenance burden, copy-paste bug risk.

### 5. DefaultNonceManager Type Declaration Mismatch (P1)

**Location**: `services/NonceManager/DefaultNonceManager.ts:77`

```typescript
// Current - declares no requirements but methods require ProviderService at runtime
export const DefaultNonceManager: Layer.Layer<NonceManagerService> =
  Layer.effect(...)
```

The layer type declares no requirements, but internal methods (`get`, `consume`) yield `ProviderService` at call time.

</high>
<medium>
### 6. Inconsistent Naming Convention (P2)

Mixed naming patterns for live layers:

| Pattern | Examples |
|---------|----------|
| `*Live` | `Bls12381Live`, `KeccakLive` |
| `Default*` | `DefaultMulticall`, `DefaultFeeEstimator` |
| `Namespace.Live` | `Signer.Live`, `DefaultTransactionSerializer.Live` |
| Factory | `HttpTransport(url)`, `LocalAccount(key)` |

### 7. Missing ServicesLive Convenience Layer (P2)

**Location**: `services/index.ts`

No convenience "batteries-included" layer combining all common services (similar to `CryptoLive`).

### 8. No Layer.provide vs Layer.provideMerge Documentation (P2)

While usage is correct, no inline comments explain when to use each pattern for future contributors.

</medium>
</findings>

<effect_improvements>
### Fix CryptoTest Layer

```typescript
// CryptoTest.ts - add missing imports and layers
import { Bls12381Test } from "./Bls12381/index.js";
import { P256Test } from "./P256/index.js";

export const CryptoTest = Layer.mergeAll(
  // ... existing 14 layers ...
  Bls12381Test,  // Add
  P256Test,      // Add
);
```

### Create TestFeeEstimator

```typescript
export const TestFeeEstimator = Layer.succeed(FeeEstimatorService, {
  estimateFeesPerGas: (type) => 
    type === 'legacy'
      ? Effect.succeed({ gasPrice: 20_000_000_000n })
      : Effect.succeed({ maxFeePerGas: 30_000_000_000n, maxPriorityFeePerGas: 1_000_000_000n }),
  getMaxPriorityFeePerGas: () => Effect.succeed(1_000_000_000n),
  baseFeeMultiplier: 1.2,
});
```

### Add Explicit Type Annotation to SignerLive

```typescript
const SignerLive: Layer.Layer<
  SignerService,
  never,
  AccountService | ProviderService | TransportService
> = Layer.effect(...)
```

### Extract Preset Factory

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
```
</effect_improvements>

<viem_comparison>
**viem Approach**: viem does not use Effect layers. Instead, it uses plain JavaScript with:
- Client configuration objects
- Chain configs imported directly
- No dependency injection

**Effect Advantage**: voltaire-effect's Layer pattern provides:
- Compile-time dependency verification
- Easy test mocking via layer replacement
- Composable service graphs
- Type-safe service resolution

**voltaire-effect Gap**: Missing test layers breaks the advantage of easy mocking. viem tests use hardcoded mocks, while voltaire-effect should leverage its Layer system.
</viem_comparison>

<implementation>
<refactoring_steps>
1. **Add Bls12381Test, P256Test to CryptoTest** - Fix critical asymmetry
2. **Create TestFeeEstimator** - Deterministic fee values for testing
3. **Create TestNonceManager** - Returns fixed nonces for testing
4. **Create TestMulticall** - Mock multicall responses
5. **Create TestBlockStream** - Emit test blocks on demand
6. **Add type annotation to SignerLive** - Explicit dependency declaration
7. **Extract createChainProvider factory** - DRY presets
8. **Add ServicesLive convenience layer** - Batteries-included option
9. **Standardize naming** - Pick one pattern and apply consistently
</refactoring_steps>
<new_patterns>
```typescript
// Pattern: Test Layer for deterministic service behavior
export const TestNonceManager = Layer.succeed(NonceManagerService, {
  get: (address) => Effect.succeed(0n),
  consume: (address) => Effect.succeed(0n),
  increment: (address) => Effect.succeed(1n),
  reset: () => Effect.succeed(void 0),
});

// Pattern: ServicesLive convenience layer
export const ServicesLive = Layer.mergeAll(
  DefaultFormatter,
  DefaultTransactionSerializer.Live,
  DefaultAbiEncoder,
  DefaultCcip,
  NoopKzg,
);
```
</new_patterns>
</implementation>

<tests>
<missing_coverage>
- CryptoTest with Bls12381Test operations
- CryptoTest with P256Test operations
- TestFeeEstimator returns expected values
- TestNonceManager deterministic sequence
- Preset layers provide all required services
- ServicesLive provides expected services
- Layer composition order edge cases
</missing_coverage>
<test_code>
```typescript
import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { CryptoTest, Bls12381Service, P256Service } from "../crypto/index.js";
import { TestFeeEstimator, FeeEstimatorService } from "../services/index.js";

describe("CryptoTest completeness", () => {
  it("provides Bls12381Service", async () => {
    const program = Effect.gen(function* () {
      const bls = yield* Bls12381Service;
      return typeof bls.sign === "function";
    });
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(CryptoTest))
    );
    expect(result).toBe(true);
  });

  it("provides P256Service", async () => {
    const program = Effect.gen(function* () {
      const p256 = yield* P256Service;
      return typeof p256.sign === "function";
    });
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(CryptoTest))
    );
    expect(result).toBe(true);
  });
});

describe("TestFeeEstimator", () => {
  it("returns deterministic EIP-1559 fees", async () => {
    const program = Effect.gen(function* () {
      const estimator = yield* FeeEstimatorService;
      return yield* estimator.estimateFeesPerGas("eip1559");
    });
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(TestFeeEstimator))
    );
    expect(result.maxFeePerGas).toBe(30_000_000_000n);
    expect(result.maxPriorityFeePerGas).toBe(1_000_000_000n);
  });
});
```
</test_code>
</tests>

<docs>
- Document Layer.provide vs Layer.provideMerge usage
- Add JSDoc to SignerLive showing all dependencies
- Document preset factory pattern for custom chains
- Add architecture diagram to services/README.md
</docs>

<api>
<changes>
1. `CryptoTest` - Add Bls12381Test, P256Test
2. `TestFeeEstimator` - New export
3. `TestNonceManager` - New export
4. `TestMulticall` - New export
5. `TestBlockStream` - New export
6. `ServicesLive` - New export
7. `createChainProvider` - New helper function
</changes>
</api>

<references>
- [Effect Layer documentation](https://effect.website/docs/requirements-management/layers)
- [Effect Context.Tag patterns](https://effect.website/docs/requirements-management/services)
- [voltaire-effect CryptoLive](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/CryptoLive.ts)
- [voltaire-effect presets](file:///Users/williamcory/voltaire/voltaire-effect/src/services/presets/index.ts)
</references>
</issue>

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
- TransactionSerializerService
- All Crypto services (CryptoLive)
```
