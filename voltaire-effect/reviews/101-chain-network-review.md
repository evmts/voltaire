# Review 101: Chain Configuration and Network Primitives

<issue>
<metadata>
priority: P1
files: [
  "voltaire-effect/src/primitives/Chain/ChainSchema.ts",
  "voltaire-effect/src/primitives/Chain/index.ts",
  "voltaire-effect/src/primitives/ChainId/Number.ts",
  "voltaire-effect/src/primitives/ChainId/BigInt.ts",
  "voltaire-effect/src/primitives/ChainId/Hex.ts",
  "voltaire-effect/src/primitives/ChainId/index.ts",
  "voltaire-effect/src/primitives/NetworkId/Number.ts",
  "voltaire-effect/src/primitives/NetworkId/BigInt.ts",
  "voltaire-effect/src/primitives/NetworkId/Hex.ts",
  "voltaire-effect/src/primitives/NetworkId/index.ts",
  "voltaire-effect/src/services/Chain/ChainService.ts",
  "voltaire-effect/src/services/Chain/chains/mainnet.ts",
  "voltaire-effect/src/services/Chain/chains/sepolia.ts",
  "voltaire-effect/src/services/Chain/chains/optimism.ts",
  "voltaire-effect/src/services/Chain/chains/arbitrum.ts",
  "voltaire-effect/src/services/Chain/chains/base.ts",
  "voltaire-effect/src/services/Chain/chains/polygon.ts",
  "voltaire-effect/src/services/Chain/chains/index.ts",
  "voltaire-effect/src/services/Chain/index.ts"
]
reviews: []
</metadata>

<module_overview>
<purpose>
Chain configuration primitives and ChainService Layer pattern. Provides typed chain IDs, network IDs, native currency configs, RPC URLs, and block explorer settings. Supports Ethereum mainnet, Sepolia testnet, and major L2s (Optimism, Arbitrum, Base, Polygon).
</purpose>
<current_status>
**CRITICAL GAP**: No tests exist for any chain/network modules. Chain definitions are correct and well-structured with good JSDoc. ChainService Layer pattern is clean. **Missing**: Holesky testnet, fallback RPC URLs, WebSocket URLs, and test coverage.
</current_status>
</module_overview>

<findings>
<critical>
### 1. No Test Coverage (P0)

**Location**: All chain/network modules

**NO TESTS EXIST** for any of these modules:

| Module | Test File | Status |
|--------|-----------|--------|
| `primitives/Chain/` | `Chain.test.ts` | ❌ Missing |
| `primitives/ChainId/` | `ChainId.test.ts` | ❌ Missing |
| `primitives/NetworkId/` | `NetworkId.test.ts` | ❌ Missing |
| `services/Chain/` | `Chain.test.ts` | ❌ Missing |

**Impact**: Schema validation bugs, chain config errors, and Layer issues undetected.

</critical>
<high>
### 2. Single RPC Per Chain (P1)

**Location**: All chain config files

Only one RPC URL per chain - no fallbacks for reliability:

| Chain | Provider | Fallback |
|-------|----------|----------|
| Mainnet | eth.merkle.io | ❌ None |
| Sepolia | 11155111.rpc.thirdweb.com | ❌ None |
| Optimism | mainnet.optimism.io | ❌ None |
| Arbitrum | arb1.arbitrum.io/rpc | ❌ None |
| Base | mainnet.base.org | ❌ None |
| Polygon | polygon-rpc.com | ❌ None |

**Impact**: Single point of failure for chain connections.

### 3. Missing Holesky Testnet (P1)

**Location**: `services/Chain/chains/`

NetworkId mentions Holesky (17000) but no ChainService Layer exists. Holesky is the primary testnet since Goerli deprecation.

### 4. ChainMetadata Type Unused (P1)

**Location**: `ChainSchema.ts`

`ChainMetadata` interface is defined but never used in ChainService or chain configs.

</high>
<medium>
### 5. No WebSocket URLs (P2)

**Location**: Chain configs

ChainMetadata has `websocketUrls` field but all chain configs leave it empty. Needed for subscriptions.

### 6. Polygon API URL Suspect (P2)

**Location**: `polygon.ts`

```typescript
apiUrl: "https://etherscan.io/v2/api?chainid=137"
```

This points to `etherscan.io/v2/api` - should verify this works for Polygon.

### 7. Duplicate ChainIdTypeSchema (P2)

**Location**: `ChainId/BigInt.ts`, `ChainId/Hex.ts`, `ChainId/Number.ts`

Same schema defined in 3 files. Should extract to shared module.

</medium>
</findings>

<effect_improvements>
### Add Test Coverage

```typescript
// Chain/Chain.test.ts
import { describe, expect, it } from "vitest";
import * as S from "effect/Schema";
import { ChainSchema } from "./ChainSchema.js";

describe("ChainSchema", () => {
  it("validates positive chain ID", () => {
    const chain = S.decodeSync(ChainSchema)({
      id: 1,
      name: "Test",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    });
    expect(chain.id).toBe(1);
  });

  it("rejects zero chain ID", () => {
    expect(() => S.decodeSync(ChainSchema)({
      id: 0,
      name: "Test",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    })).toThrow();
  });

  it("rejects negative chain ID", () => {
    expect(() => S.decodeSync(ChainSchema)({
      id: -1,
      name: "Test",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    })).toThrow();
  });
});

// ChainId/ChainId.test.ts
describe("ChainId.Number", () => {
  it("decodes positive integers", () => {
    const id = S.decodeSync(ChainId.Number)(1);
    expect(id).toBe(1n);
  });

  it("rejects zero", () => {
    expect(() => S.decodeSync(ChainId.Number)(0)).toThrow();
  });
});

describe("ChainId.Hex", () => {
  it("decodes 0x1 to 1", () => {
    const id = S.decodeSync(ChainId.Hex)("0x1");
    expect(id).toBe(1n);
  });

  it("decodes 0xaa36a7 to 11155111", () => {
    const id = S.decodeSync(ChainId.Hex)("0xaa36a7");
    expect(id).toBe(11155111n);
  });
});
```

### Add Fallback RPCs

```typescript
// mainnet.ts
export const mainnetConfig: ChainConfig = {
  id: 1,
  name: "Ethereum",
  rpcUrls: {
    http: [
      "https://eth.merkle.io",
      "https://eth.llamarpc.com",
      "https://rpc.ankr.com/eth",
    ],
    websocket: [
      "wss://eth.merkle.io",
    ],
  },
  // ...
};
```

### Add Holesky Testnet

```typescript
// chains/holesky.ts
export const holeskyConfig: ChainConfig = {
  id: 17000,
  name: "Holesky",
  nativeCurrency: { name: "Holesky Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    http: ["https://holesky.drpc.org"],
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://holesky.etherscan.io",
      apiUrl: "https://api-holesky.etherscan.io/api",
    },
  },
  testnet: true,
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 77,
    },
  },
};

export const holesky = Layer.succeed(ChainService, holeskyConfig);
```

### Extract Shared ChainIdTypeSchema

```typescript
// ChainId/ChainIdTypeSchema.ts
import * as S from "effect/Schema";

export type ChainIdType = bigint & { readonly __tag: "ChainId" };

export const ChainIdTypeSchema = S.declare<ChainIdType>(
  (u): u is ChainIdType => typeof u === "bigint" && u > 0n,
  { identifier: "ChainId" },
);

// Then in Number.ts, BigInt.ts, Hex.ts:
import { ChainIdTypeSchema, type ChainIdType } from "./ChainIdTypeSchema.js";
```

### Add Chain Factory Helper

```typescript
// Chain/from.ts
export const from = (config: ChainConfigInput): Effect.Effect<ChainConfig, ChainValidationError> =>
  Effect.try({
    try: () => S.decodeSync(ChainSchema)(config),
    catch: (e) => new ChainValidationError(e),
  });

// Creates Layer from config
export const toLayer = (config: ChainConfig): Layer.Layer<ChainService> =>
  Layer.succeed(ChainService, config);
```
</effect_improvements>

<viem_comparison>
**viem Chain Approach**:
- Exports chain objects directly (not Layers)
- Each chain is a typed object with `chain.id`, `chain.name`, etc.
- No dependency injection
- Multiple RPC fallbacks per chain

**voltaire-effect Advantages**:
- ChainService as Effect Layer enables DI
- Type-safe service resolution
- Easy to swap chains at composition time
- Can create custom chains with `Layer.succeed`

**voltaire-effect Gaps**:
- Missing Holesky (viem has it)
- No RPC fallbacks (viem has multiple)
- No WebSocket URLs (viem has them)
- Missing several chains (BSC, Avalanche, zkSync)
</viem_comparison>

<implementation>
<refactoring_steps>
1. **Create test files** - Chain.test.ts, ChainId.test.ts, NetworkId.test.ts, services/Chain.test.ts
2. **Add Holesky config** - Primary testnet
3. **Add RPC fallbacks** - At least 2-3 per chain
4. **Add WebSocket URLs** - For subscriptions
5. **Extract ChainIdTypeSchema** - DRY shared module
6. **Verify Polygon API URL** - Fix if needed
7. **Add Chain.from helper** - Effect-wrapped constructor
8. **Consider more chains** - BSC, Avalanche, zkSync, Polygon zkEVM
</refactoring_steps>
<new_patterns>
```typescript
// Pattern: ChainService with dependency injection
import * as Effect from "effect/Effect";
import { ChainService } from "./ChainService.js";

// Get current chain in Effect context
const program = Effect.gen(function* () {
  const chain = yield* ChainService;
  console.log(`Connected to ${chain.name} (${chain.id})`);
  return chain.id;
});

// Provide different chains
await Effect.runPromise(program.pipe(Effect.provide(mainnet)));
await Effect.runPromise(program.pipe(Effect.provide(sepolia)));

// Pattern: Custom chain
const customChain = Layer.succeed(ChainService, {
  id: 12345,
  name: "My Private Chain",
  nativeCurrency: { name: "MPC", symbol: "MPC", decimals: 18 },
  rpcUrls: { http: ["http://localhost:8545"] },
});

// Pattern: Chain switching
const chainForEnv = process.env.NODE_ENV === "production" ? mainnet : sepolia;
```
</new_patterns>
</implementation>

<tests>
<missing_coverage>
- ChainSchema positive ID validation
- ChainSchema zero ID rejection
- ChainSchema negative ID rejection
- ChainSchema nativeCurrency requirement
- ChainId.Number positive integer decode
- ChainId.BigInt MAX_SAFE_INTEGER handling
- ChainId.Hex decode 0x1, 0xaa36a7
- NetworkId allows 0 (unlike ChainId)
- ChainService Layer provides correct config
- Sepolia marked as testnet
- L2 chains have correct block times
- mainnet has multicall3 contract
- sepolia has ensUniversalResolver
</missing_coverage>
<test_code>
```typescript
// services/Chain/Chain.test.ts
import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { ChainService, mainnet, sepolia, optimism } from "./index.js";

describe("ChainService Layers", () => {
  it("mainnet has correct chain ID", async () => {
    const program = Effect.gen(function* () {
      const chain = yield* ChainService;
      return chain.id;
    });
    const result = await Effect.runPromise(program.pipe(Effect.provide(mainnet)));
    expect(result).toBe(1);
  });

  it("sepolia is marked as testnet", async () => {
    const program = Effect.gen(function* () {
      const chain = yield* ChainService;
      return chain.testnet;
    });
    const result = await Effect.runPromise(program.pipe(Effect.provide(sepolia)));
    expect(result).toBe(true);
  });

  it("mainnet has multicall3 contract", async () => {
    const program = Effect.gen(function* () {
      const chain = yield* ChainService;
      return chain.contracts?.multicall3?.address;
    });
    const result = await Effect.runPromise(program.pipe(Effect.provide(mainnet)));
    expect(result).toBe("0xcA11bde05977b3631167028862bE2a173976CA11");
  });

  it("optimism has correct L2 properties", async () => {
    const program = Effect.gen(function* () {
      const chain = yield* ChainService;
      return { id: chain.id, name: chain.name };
    });
    const result = await Effect.runPromise(program.pipe(Effect.provide(optimism)));
    expect(result.id).toBe(10);
    expect(result.name).toBe("OP Mainnet");
  });
});

// ChainId/ChainId.test.ts
describe("ChainId schemas", () => {
  describe("Number", () => {
    it("decodes valid chain ID", () => {
      expect(S.decodeSync(ChainId.Number)(1)).toBe(1n);
      expect(S.decodeSync(ChainId.Number)(11155111)).toBe(11155111n);
    });

    it("rejects zero", () => {
      expect(() => S.decodeSync(ChainId.Number)(0)).toThrow();
    });

    it("rejects negative", () => {
      expect(() => S.decodeSync(ChainId.Number)(-1)).toThrow();
    });
  });

  describe("Hex", () => {
    it("decodes hex chain IDs", () => {
      expect(S.decodeSync(ChainId.Hex)("0x1")).toBe(1n);
      expect(S.decodeSync(ChainId.Hex)("0xa")).toBe(10n); // Optimism
      expect(S.decodeSync(ChainId.Hex)("0xaa36a7")).toBe(11155111n); // Sepolia
    });
  });
});
```
</test_code>
</tests>

<docs>
- Document ChainService Layer usage
- Add custom chain creation example
- Document RPC URL selection strategy
- Add chain switching guide
- Document testnet vs mainnet distinction
</docs>

<api>
<changes>
1. `ChainIdTypeSchema` - Extract to shared module
2. `holeskyConfig` and `holesky` Layer - New exports
3. `Chain.from()` - Effect-wrapped constructor
4. `Chain.toLayer()` - Create Layer from config
5. All chains - Add `websocket` URLs
6. All chains - Add RPC fallbacks
</changes>
</api>

<references>
- [EIP-155: Chain ID](https://eips.ethereum.org/EIPS/eip-155)
- [Chain ID Registry](https://chainlist.org/)
- [viem Chains](https://github.com/wevm/viem/tree/main/src/chains)
- [Effect Layer documentation](https://effect.website/docs/requirements-management/layers)
</references>
</issue>

## Chain Configuration Matrix

| Chain | ID | Testnet | Multicall3 | ENS | WebSocket |
|-------|-----|---------|------------|-----|-----------|
| Ethereum | 1 | ❌ | ✅ | ✅ | ❌ Missing |
| Sepolia | 11155111 | ✅ | ✅ | ✅ | ❌ Missing |
| Holesky | 17000 | ✅ | ✅ | ❌ | ❌ **Not Added** |
| Optimism | 10 | ❌ | ✅ | ❌ | ❌ Missing |
| Arbitrum | 42161 | ❌ | ✅ | ❌ | ❌ Missing |
| Base | 8453 | ❌ | ✅ | ❌ | ❌ Missing |
| Polygon | 137 | ❌ | ✅ | ❌ | ❌ Missing |

## Type Structure

```
primitives/
├── Chain/
│   ├── ChainSchema.ts    # ChainType, ChainSchema, ChainMetadata
│   └── index.ts          # Re-exports
├── ChainId/
│   ├── ChainIdTypeSchema.ts  # Shared (TO ADD)
│   ├── Number.ts         # ChainIdType, Number schema
│   ├── BigInt.ts         # BigInt schema
│   ├── Hex.ts            # Hex schema
│   └── index.ts          # Re-exports
└── NetworkId/
    ├── Number.ts         # NetworkIdType, constants
    ├── BigInt.ts         # BigInt schema
    ├── Hex.ts            # Hex schema
    └── index.ts          # Re-exports

services/
└── Chain/
    ├── ChainService.ts   # ChainConfig, ChainService Tag
    ├── chains/
    │   ├── mainnet.ts
    │   ├── sepolia.ts
    │   ├── holesky.ts    # TO ADD
    │   ├── optimism.ts
    │   ├── arbitrum.ts
    │   ├── base.ts
    │   ├── polygon.ts
    │   └── index.ts
    └── index.ts
```
