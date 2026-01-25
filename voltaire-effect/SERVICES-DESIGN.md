# Voltaire-Effect Services Architecture

## Design Philosophy

Unlike viem's strategy pattern where everything is passed as config objects, we use Effect's **dependency injection via Layers**. This gives us:

1. **Compile-time safety** - Missing dependencies are type errors
2. **Testability** - Swap any service with a test implementation
3. **Composability** - Layer composition for different environments
4. **Modularity** - Services are independent, tree-shakeable

## Service Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Program                             │
│   Effect.gen(function* () {                                      │
│     const provider = yield* ProviderService                      │
│     return yield* provider.getBlock()                            │
│   })                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      High-Level Services                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Provider │  │ Contract │  │  Signer  │  │ Account          │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
└───────┼─────────────┼─────────────┼─────────────────┼───────────┘
        │             │             │                 │
        ▼             ▼             ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Mid-Level Services                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐  │
│  │ Formatter  │  │ FeeEstim.  │  │ NonceManager│  │ Multicall │  │
│  └─────┬──────┘  └─────┬──────┘  └──────┬──────┘  └─────┬─────┘  │
│  ┌─────┴──────┐  ┌─────┴──────┐  ┌──────┴──────┐  ┌─────┴─────┐  │
│  │ TxSerial.  │  │    Kzg     │  │   Cache     │  │   Ccip    │  │
│  └─────┬──────┘  └─────┬──────┘  └──────┬──────┘  └─────┬─────┘  │
└────────┼───────────────┼────────────────┼───────────────┼────────┘
         │               │                │               │
         ▼               ▼                ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Low-Level Services                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Transport                             │  │
│  │  (HttpTransport | WebSocketTransport | TestTransport)      │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                        Chain                               │  │
│  │  (Mainnet | Optimism | Arbitrum | Custom)                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Service Definitions

### 1. ChainService

Chain metadata and configuration. Every chain can override formatters, serializers, and fee logic.

```typescript
// src/services/Chain/ChainService.ts
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"

export interface ChainConfig {
  readonly id: number
  readonly name: string
  readonly nativeCurrency: {
    readonly name: string
    readonly symbol: string
    readonly decimals: number
  }
  readonly blockTime: number // milliseconds
  readonly rpcUrls: {
    readonly default: { readonly http: readonly string[] }
  }
  readonly blockExplorers?: {
    readonly default: { readonly name: string; readonly url: string }
  }
  readonly contracts?: {
    readonly multicall3?: { readonly address: `0x${string}`; readonly blockCreated?: number }
    readonly ensRegistry?: { readonly address: `0x${string}` }
    readonly ensUniversalResolver?: { readonly address: `0x${string}` }
  }
  readonly testnet?: boolean
}

export class ChainService extends Context.Tag("ChainService")<
  ChainService,
  ChainConfig
>() {}
```

### 2. TransactionSerializerService

Handles RLP encoding/decoding. L2s override this for custom tx types.

```typescript
// src/services/TransactionSerializer/TransactionSerializerService.ts
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Data from "effect/Data"
import type { Transaction } from "../../primitives/Transaction/index.js"

export class SerializeError extends Data.TaggedError("SerializeError")<{
  readonly transaction: unknown
  readonly message: string
  readonly cause?: unknown
}> {}

export class DeserializeError extends Data.TaggedError("DeserializeError")<{
  readonly bytes: Uint8Array
  readonly message: string
  readonly cause?: unknown
}> {}

export class TransactionSerializerService extends Context.Tag("TransactionSerializerService")<
  TransactionSerializerService,
  {
    readonly serialize: (tx: Transaction.Any) => Effect.Effect<Uint8Array, SerializeError>
    readonly deserialize: (bytes: Uint8Array) => Effect.Effect<Transaction.Any, DeserializeError>
    readonly getSigningPayload: (tx: Transaction.Any) => Effect.Effect<Uint8Array, SerializeError>
  }
>() {}
```

### 3. FormatterService

Transforms RPC responses to internal types. Chains override for custom fields.

```typescript
// src/services/Formatter/FormatterService.ts
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Data from "effect/Data"

export class FormatError extends Data.TaggedError("FormatError")<{
  readonly input: unknown
  readonly type: "block" | "transaction" | "receipt" | "request"
  readonly message: string
}> {}

export class FormatterService extends Context.Tag("FormatterService")<
  FormatterService,
  {
    readonly formatBlock: (rpc: unknown) => Effect.Effect<Block, FormatError>
    readonly formatTransaction: (rpc: unknown) => Effect.Effect<Transaction, FormatError>
    readonly formatReceipt: (rpc: unknown) => Effect.Effect<Receipt, FormatError>
    readonly formatRequest: (tx: TransactionRequest) => Effect.Effect<unknown, FormatError>
  }
>() {}
```

### 4. FeeEstimatorService

Estimates gas fees. Chains override for L2-specific logic (e.g., Optimism L1 data fee).

```typescript
// src/services/FeeEstimator/FeeEstimatorService.ts
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Data from "effect/Data"

export type FeeValuesLegacy = { readonly gasPrice: bigint }
export type FeeValuesEIP1559 = { 
  readonly maxFeePerGas: bigint
  readonly maxPriorityFeePerGas: bigint 
}
export type FeeValues = FeeValuesLegacy | FeeValuesEIP1559

export class FeeEstimationError extends Data.TaggedError("FeeEstimationError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

export class FeeEstimatorService extends Context.Tag("FeeEstimatorService")<
  FeeEstimatorService,
  {
    readonly estimateFeesPerGas: (
      type: "legacy" | "eip1559"
    ) => Effect.Effect<FeeValues, FeeEstimationError, ProviderService>
    readonly getMaxPriorityFeePerGas: () => Effect.Effect<bigint, FeeEstimationError, ProviderService>
    readonly baseFeeMultiplier: number // default 1.2
  }
>() {}
```

### 5. NonceManagerService

Tracks and increments nonces to prevent conflicts in concurrent sends.

```typescript
// src/services/NonceManager/NonceManagerService.ts
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Data from "effect/Data"
import type { AddressType } from "../../primitives/Address/index.js"

export class NonceError extends Data.TaggedError("NonceError")<{
  readonly address: AddressType
  readonly message: string
  readonly cause?: unknown
}> {}

export class NonceManagerService extends Context.Tag("NonceManagerService")<
  NonceManagerService,
  {
    /** Get current nonce without incrementing */
    readonly get: (address: AddressType) => Effect.Effect<number, NonceError, ProviderService>
    /** Get nonce and increment for next use */
    readonly consume: (address: AddressType) => Effect.Effect<number, NonceError, ProviderService>
    /** Manually increment nonce delta */
    readonly increment: (address: AddressType) => Effect.Effect<void>
    /** Reset nonce tracking for address */
    readonly reset: (address: AddressType) => Effect.Effect<void>
  }
>() {}
```

### 6. MulticallService

Batches multiple contract reads into a single RPC call.

```typescript
// src/services/Multicall/MulticallService.ts
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Data from "effect/Data"

export interface MulticallCall {
  readonly target: AddressType
  readonly callData: Uint8Array
  readonly allowFailure?: boolean
}

export interface MulticallResult {
  readonly success: boolean
  readonly returnData: Uint8Array
}

export class MulticallError extends Data.TaggedError("MulticallError")<{
  readonly message: string
  readonly failedCalls?: number[]
  readonly cause?: unknown
}> {}

export class MulticallService extends Context.Tag("MulticallService")<
  MulticallService,
  {
    readonly aggregate: (
      calls: readonly MulticallCall[]
    ) => Effect.Effect<readonly MulticallResult[], MulticallError, ProviderService | ChainService>
    readonly aggregate3: (
      calls: readonly MulticallCall[]
    ) => Effect.Effect<readonly MulticallResult[], MulticallError, ProviderService | ChainService>
  }
>() {}
```

### 7. KzgService

KZG commitment/proof generation for EIP-4844 blob transactions.

```typescript
// src/services/Kzg/KzgService.ts
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Data from "effect/Data"

export class KzgError extends Data.TaggedError("KzgError")<{
  readonly operation: "blobToCommitment" | "computeProof" | "verifyProof"
  readonly message: string
  readonly cause?: unknown
}> {}

export class KzgService extends Context.Tag("KzgService")<
  KzgService,
  {
    readonly blobToCommitment: (blob: Uint8Array) => Effect.Effect<Uint8Array, KzgError>
    readonly computeProof: (blob: Uint8Array, commitment: Uint8Array) => Effect.Effect<Uint8Array, KzgError>
    readonly verifyProof: (
      commitment: Uint8Array,
      z: Uint8Array,
      y: Uint8Array,
      proof: Uint8Array
    ) => Effect.Effect<boolean, KzgError>
  }
>() {}
```

### 8. CacheService

Caches RPC responses to reduce network calls.

```typescript
// src/services/Cache/CacheService.ts
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"

export class CacheService extends Context.Tag("CacheService")<
  CacheService,
  {
    readonly get: <T>(key: string) => Effect.Effect<Option.Option<T>>
    readonly set: <T>(key: string, value: T, ttlMs?: number) => Effect.Effect<void>
    readonly delete: (key: string) => Effect.Effect<void>
    readonly clear: () => Effect.Effect<void>
  }
>() {}
```

### 9. CcipService

CCIP-Read (EIP-3668) offchain data lookups.

```typescript
// src/services/Ccip/CcipService.ts
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Data from "effect/Data"

export interface CcipRequest {
  readonly sender: AddressType
  readonly urls: readonly string[]
  readonly callData: Uint8Array
  readonly callbackSelector: Uint8Array
  readonly extraData: Uint8Array
}

export class CcipError extends Data.TaggedError("CcipError")<{
  readonly urls: readonly string[]
  readonly message: string
  readonly cause?: unknown
}> {}

export class CcipService extends Context.Tag("CcipService")<
  CcipService,
  {
    readonly request: (params: CcipRequest) => Effect.Effect<Uint8Array, CcipError>
  }
>() {}
```

### 10. AbiEncoderService

ABI encoding/decoding for contract interactions.

```typescript
// src/services/AbiEncoder/AbiEncoderService.ts
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Data from "effect/Data"

export class AbiEncodeError extends Data.TaggedError("AbiEncodeError")<{
  readonly functionName: string
  readonly args: readonly unknown[]
  readonly message: string
}> {}

export class AbiDecodeError extends Data.TaggedError("AbiDecodeError")<{
  readonly data: Uint8Array
  readonly message: string
}> {}

export class AbiEncoderService extends Context.Tag("AbiEncoderService")<
  AbiEncoderService,
  {
    readonly encodeFunction: (
      abi: readonly AbiItem[],
      functionName: string,
      args: readonly unknown[]
    ) => Effect.Effect<Uint8Array, AbiEncodeError>
    readonly decodeFunction: (
      abi: readonly AbiItem[],
      functionName: string,
      data: Uint8Array
    ) => Effect.Effect<readonly unknown[], AbiDecodeError>
    readonly encodeEventTopics: (
      abi: readonly AbiItem[],
      eventName: string,
      args?: readonly unknown[]
    ) => Effect.Effect<readonly Uint8Array[], AbiEncodeError>
    readonly decodeEventLog: (
      abi: readonly AbiItem[],
      eventName: string,
      data: Uint8Array,
      topics: readonly Uint8Array[]
    ) => Effect.Effect<Record<string, unknown>, AbiDecodeError>
  }
>() {}
```

## Layer Composition Examples

### Basic Mainnet Setup

```typescript
import { Effect, Layer } from "effect"
import { 
  ProviderService, Provider,
  HttpTransport,
  ChainService, Mainnet,
  FormatterService, DefaultFormatter,
  TransactionSerializerService, DefaultTransactionSerializer,
  FeeEstimatorService, DefaultFeeEstimator,
} from "voltaire-effect/services"

// Compose all layers
const MainnetLive = Layer.mergeAll(
  Provider,
  DefaultFormatter,
  DefaultTransactionSerializer,
  DefaultFeeEstimator,
).pipe(
  Layer.provide(HttpTransport("https://eth.llamarpc.com")),
  Layer.provide(Mainnet),
)

// Use it
const program = Effect.gen(function* () {
  const provider = yield* ProviderService
  return yield* provider.getBlockNumber()
}).pipe(Effect.provide(MainnetLive))
```

### Optimism with Custom Serializer

```typescript
import { Layer } from "effect"
import { 
  Provider,
  HttpTransport,
  Optimism,
  OptimismTransactionSerializer, // Custom for deposit txs
  OptimismFeeEstimator,          // Includes L1 data fee
} from "voltaire-effect/services"

const OptimismLive = Layer.mergeAll(
  Provider,
  DefaultFormatter,
  OptimismTransactionSerializer,  // Override for OP
  OptimismFeeEstimator,           // Override for OP
).pipe(
  Layer.provide(HttpTransport("https://mainnet.optimism.io")),
  Layer.provide(Optimism),
)
```

### Testing with Mocks

```typescript
import { Layer } from "effect"
import { 
  Provider,
  TestTransport,
  TestChain,
  TestFormatter,
  TestFeeEstimator,
} from "voltaire-effect/services"

const TestLive = Layer.mergeAll(
  Provider,
  TestFormatter,
  TestFeeEstimator,
).pipe(
  Layer.provide(TestTransport({ 
    "eth_blockNumber": "0x100",
    "eth_chainId": "0x1",
  })),
  Layer.provide(TestChain),
)
```

## Preset Compositions

For convenience, we provide pre-composed layers:

```typescript
// src/services/presets/chains.ts

/** Mainnet with all defaults */
export const MainnetProvider = (rpcUrl: string) => 
  Layer.mergeAll(
    Provider,
    DefaultFormatter,
    DefaultTransactionSerializer,
    DefaultFeeEstimator,
    DefaultNonceManager,
    DefaultCache,
  ).pipe(
    Layer.provide(HttpTransport(rpcUrl)),
    Layer.provide(Mainnet),
  )

/** Optimism with L2-specific overrides */
export const OptimismProvider = (rpcUrl: string) =>
  Layer.mergeAll(
    Provider,
    DefaultFormatter,
    OptimismTransactionSerializer,
    OptimismFeeEstimator,
    DefaultNonceManager,
    DefaultCache,
  ).pipe(
    Layer.provide(HttpTransport(rpcUrl)),
    Layer.provide(Optimism),
  )

/** Arbitrum with L2-specific overrides */
export const ArbitrumProvider = (rpcUrl: string) =>
  Layer.mergeAll(
    Provider,
    DefaultFormatter,
    ArbitrumTransactionSerializer,
    ArbitrumFeeEstimator,
    DefaultNonceManager,
    DefaultCache,
  ).pipe(
    Layer.provide(HttpTransport(rpcUrl)),
    Layer.provide(Arbitrum),
  )
```

## File Structure

```
src/services/
├── index.ts                          # Re-exports all services
├── errors.ts                         # Shared error types
│
├── Transport/                        # ✅ EXISTS
│   ├── TransportService.ts
│   ├── HttpTransport.ts
│   ├── WebSocketTransport.ts
│   ├── BrowserTransport.ts
│   ├── TestTransport.ts
│   └── index.ts
│
├── Provider/                         # ✅ EXISTS
│   ├── ProviderService.ts
│   ├── Provider.ts
│   └── index.ts
│
├── Signer/                           # ✅ EXISTS
│   ├── SignerService.ts
│   ├── Signer.ts
│   └── index.ts
│
├── Account/                          # ✅ EXISTS
│   ├── AccountService.ts
│   ├── LocalAccount.ts
│   ├── JsonRpcAccount.ts
│   └── index.ts
│
├── Contract/                         # ✅ EXISTS
│   ├── ContractTypes.ts
│   ├── Contract.ts
│   └── index.ts
│
├── Chain/                            # 🆕 NEW
│   ├── ChainService.ts
│   ├── chains/
│   │   ├── mainnet.ts
│   │   ├── sepolia.ts
│   │   ├── optimism.ts
│   │   ├── arbitrum.ts
│   │   ├── base.ts
│   │   ├── polygon.ts
│   │   └── index.ts
│   └── index.ts
│
├── TransactionSerializer/            # 🆕 NEW
│   ├── TransactionSerializerService.ts
│   ├── DefaultTransactionSerializer.ts
│   ├── OptimismTransactionSerializer.ts
│   └── index.ts
│
├── Formatter/                        # 🆕 NEW
│   ├── FormatterService.ts
│   ├── DefaultFormatter.ts
│   └── index.ts
│
├── FeeEstimator/                     # 🆕 NEW
│   ├── FeeEstimatorService.ts
│   ├── DefaultFeeEstimator.ts
│   ├── OptimismFeeEstimator.ts
│   ├── ArbitrumFeeEstimator.ts
│   └── index.ts
│
├── NonceManager/                     # 🆕 NEW
│   ├── NonceManagerService.ts
│   ├── DefaultNonceManager.ts
│   └── index.ts
│
├── Multicall/                        # 🆕 NEW
│   ├── MulticallService.ts
│   ├── DefaultMulticall.ts
│   └── index.ts
│
├── Kzg/                              # 🆕 NEW
│   ├── KzgService.ts
│   ├── DefaultKzg.ts
│   └── index.ts
│
├── Cache/                            # 🆕 NEW
│   ├── CacheService.ts
│   ├── MemoryCache.ts
│   └── index.ts
│
├── Ccip/                             # 🆕 NEW
│   ├── CcipService.ts
│   ├── DefaultCcip.ts
│   └── index.ts
│
├── AbiEncoder/                       # 🆕 NEW
│   ├── AbiEncoderService.ts
│   ├── DefaultAbiEncoder.ts
│   └── index.ts
│
└── presets/                          # ✅ EXISTS (expand)
    ├── index.ts
    ├── mainnet.ts
    ├── optimism.ts
    ├── arbitrum.ts
    └── base.ts
```

## Implementation Priority

1. **ChainService** - Foundation for chain-specific behavior
2. **FormatterService** - Needed by Provider for response formatting
3. **TransactionSerializerService** - Needed by Signer for tx encoding
4. **FeeEstimatorService** - Needed by Signer for gas estimation
5. **NonceManagerService** - Needed by Signer for concurrent sends
6. **AbiEncoderService** - Needed by Contract for encoding
7. **MulticallService** - Performance optimization
8. **CacheService** - Performance optimization
9. **KzgService** - EIP-4844 blob support
10. **CcipService** - ENS and offchain data
