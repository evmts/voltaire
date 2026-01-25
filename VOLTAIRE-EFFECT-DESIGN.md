# voltaire-effect Design Specification

## Overview

`voltaire-effect` is a separate npm package that provides Effect.ts integration for Voltaire's Ethereum primitives. It wraps Voltaire's data-first branded types with Effect Schema for validation, and provides Effect-based services for higher-level abstractions like Providers and Wallets.

## Package Architecture

### Package Identity
- **Name**: `voltaire-effect` (NOT `@tevm/voltaire-effect`)
- **Peer Dependency**: `@tevm/voltaire`
- **Dependencies**: `effect`

### Relationship to Voltaire
```typescript
// voltaire-effect imports and wraps Voltaire types
import { Hex, type HexType } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'

// Schemas decode TO actual Voltaire branded types
const myHex: HexType = Schema.decodeSync(HexSchema)("0x1234")
```

## Error System

### VoltaireError Base Class (in @tevm/voltaire)

```typescript
// src/errors/VoltaireError.ts
export class VoltaireError extends Error {
  readonly _tag: string

  constructor(
    public readonly input: unknown,
    message?: string,
    cause?: Error
  ) {
    const finalMessage = message ?? cause?.message ?? `Error: ${input}`
    super(finalMessage, cause ? { cause } : undefined)
    this._tag = this.constructor.name
    this.name = this.constructor.name
  }
}
```

### Specific Error Pattern

```typescript
export class InvalidHexError extends VoltaireError {
  readonly _tag = "InvalidHex" as const
  override name = "InvalidHex" as const

  constructor(input: unknown, cause?: Error) {
    super(input, `Invalid hex: ${input}`, cause)
  }
}
```

### Error Design Principles
- **_tag and name**: Both as const literals (duplicated for Effect.ts compatibility)
- **Cause chaining**: Viem-inspired cause handling via Error options
- **Message building**: Message derived from cause if not provided
- **Minimal API**: Only `_tag`, `name`, `input`, `message`, `cause` - no walk(), no docsPath

## Schema Pattern

### Core Pattern: Schema.transformOrFail

```typescript
// voltaire-effect/src/primitives/Hex.ts
import { Hex as VoltaireHex, type HexType, InvalidHexError } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

export const HexSchema: Schema.Schema<HexType, string> =
  Schema.transformOrFail(
    Schema.String,
    Schema.String,
    {
      decode: (s, options, ast) => {
        try {
          return ParseResult.succeed(VoltaireHex(s))
        } catch (e) {
          // Use Voltaire's typed errors directly
          return ParseResult.fail(new ParseResult.Type(ast, s, e.message))
        }
      },
      encode: (h: HexType) => ParseResult.succeed(h)
    }
  )
```

### Why transformOrFail (not declare)
- **declare** (lowest level): Direct AST access, parsing options/context
- **transformOrFail** (mid level): Simpler API, handles AST automatically
- For wrapping Voltaire constructors, transformOrFail is sufficient - we just call `Hex(s)` which already validates

### Schema Output
Schemas decode to **actual Voltaire branded types**, not wrapper classes:
```typescript
const hex: HexType = Schema.decodeSync(HexSchema)("0x1234")
// hex is real HexType from @tevm/voltaire, not a wrapper
```

## Multidirectional Schemas

Effect Schema supports bidirectional/multidirectional transformations. Use this idiomatically:

```typescript
// Address can decode from multiple formats
export const AddressSchema: Schema.Schema<AddressType, string> = Schema.transformOrFail(...)

// Compose schemas for format conversions
export const AddressFromHex = Schema.compose(HexSchema, AddressSchema)
export const AddressFromChecksummed = Schema.compose(ChecksummedAddressSchema, AddressSchema)

// Or use Schema.Union for multiple input formats
export const AddressFromAny = Schema.Union(
  AddressFromHex,
  AddressFromChecksummed,
  AddressFromBytes
)
```

### Address Example with Multiple Formats
```typescript
import { Address, type AddressType } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'

// Base schema - string to AddressType
export const AddressSchema: Schema.Schema<AddressType, string> = 
  Schema.transformOrFail(Schema.String, Schema.String, {
    decode: (s) => {
      try { return ParseResult.succeed(Address(s)) }
      catch (e) { return ParseResult.fail(...) }
    },
    encode: (a) => ParseResult.succeed(a)
  })

// Checksummed output
export const ChecksummedAddressSchema: Schema.Schema<string, AddressType> =
  Schema.transform(AddressSchema, Schema.String, {
    decode: (addr) => Address.toChecksummed(addr),
    encode: (s) => Address(s)
  })

// Bytes input
export const AddressFromBytesSchema: Schema.Schema<AddressType, Uint8Array> =
  Schema.transformOrFail(Schema.Uint8ArrayFromSelf, Schema.Unknown, {
    decode: (bytes) => {
      try { return ParseResult.succeed(Address.fromBytes(bytes)) }
      catch (e) { return ParseResult.fail(...) }
    },
    encode: (addr) => ParseResult.succeed(Address.toBytes(addr))
  })
```

## Complex Types (TaggedClass)

For discriminated unions like Transaction, use TaggedClass **only if shape matches Voltaire type exactly**:

```typescript
import { 
  type LegacyTransactionType,
  type Eip1559TransactionType,
  type TransactionType 
} from '@tevm/voltaire'

// TaggedClass must match Voltaire's shape exactly for interchangeability
export class LegacyTransactionSchema extends Schema.TaggedClass<LegacyTransactionSchema>()("legacy", {
  nonce: NonceSchema,
  gasPrice: GasPriceSchema,
  gasLimit: GasLimitSchema,
  to: Schema.NullOr(AddressSchema),
  value: ValueSchema,
  data: HexSchema,
  v: Schema.BigInt,
  r: Bytes32Schema,
  s: Bytes32Schema,
}) {
  // Type assertion - must be structurally identical
  toVoltaire(): LegacyTransactionType { return this as unknown as LegacyTransactionType }
}

// Union of all transaction types
export const TransactionSchema = Schema.Union(
  LegacyTransactionSchema,
  Eip1559TransactionSchema,
  Eip4844TransactionSchema,
  Eip7702TransactionSchema,
)
```

**Rule**: If TaggedClass can't match Voltaire's shape exactly, use plain `Schema.transformOrFail` to output unaltered Voltaire type instead.

## File Organization

**Mirrors core Voltaire lib structure exactly:**

```
voltaire-effect/
├── src/
│   ├── primitives/
│   │   ├── Abi/
│   │   │   ├── AbiSchema.ts
│   │   │   ├── AbiSchema.test.ts
│   │   │   └── index.ts
│   │   ├── Address/
│   │   │   ├── AddressSchema.ts
│   │   │   ├── AddressFromBytes.ts
│   │   │   ├── ChecksummedAddressSchema.ts
│   │   │   └── index.ts
│   │   ├── Block/
│   │   ├── Hash/
│   │   ├── Hex/
│   │   ├── Transaction/
│   │   └── ... (matches src/primitives/ in voltaire)
│   ├── crypto/
│   │   ├── Keccak256/
│   │   ├── Secp256k1/
│   │   └── ... (matches src/crypto/ in voltaire)
│   ├── services/
│   │   ├── Provider/
│   │   ├── Wallet/
│   │   └── Eip1193/
│   ├── errors/
│   │   └── index.ts
│   └── index.ts
├── docs/                     # Mintlify docs site
└── package.json
```

## Export Pattern

Match Voltaire's namespace pattern:

```typescript
// voltaire-effect/src/primitives/Address/index.ts
export { AddressSchema } from './AddressSchema.js'
export { AddressFromBytesSchema } from './AddressFromBytes.js'
export { ChecksummedAddressSchema } from './ChecksummedAddressSchema.js'

// voltaire-effect/src/index.ts
export * as Address from './primitives/Address/index.js'
export * as Hex from './primitives/Hex/index.js'
export * as Transaction from './primitives/Transaction/index.js'

// Usage
import { Address, Hex } from 'voltaire-effect'
const addr = Schema.decodeSync(Address.Schema)("0x...")
const checksummed = Schema.decodeSync(Address.ChecksummedSchema)(addr)
```

## Effect-Wrapped Helper Functions

All Voltaire helper functions get Effect versions that return `Effect` instead of throwing:

```typescript
// voltaire-effect/src/primitives/Hex/toBytes.ts
import { Hex, type HexType, InvalidHexError } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

// Voltaire throws: Hex.toBytes("invalid") throws InvalidHexError
// Effect version returns Effect with error in channel
export const toBytes = (hex: HexType): Effect.Effect<Uint8Array, InvalidHexError> =>
  Effect.try({
    try: () => Hex.toBytes(hex),
    catch: (e) => e as InvalidHexError
  })

// For sync functions that can't fail, use Effect.sync
export const size = (hex: HexType): Effect.Effect<number> =>
  Effect.sync(() => Hex.size(hex))
```

### Async Functions (Promise → Effect)

```typescript
// voltaire-effect/src/crypto/Keccak256/hash.ts
import { Keccak256 } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

// Voltaire: Keccak256.hash(data): Promise<HashType>
// Effect version
export const hash = (data: Uint8Array): Effect.Effect<HashType, Keccak256Error> =>
  Effect.tryPromise({
    try: () => Keccak256.hash(data),
    catch: (e) => e as Keccak256Error
  })
```

### Pattern for All Modules

```typescript
// voltaire-effect/src/primitives/Address/index.ts
import { Address as VoltaireAddress, type AddressType, InvalidAddressError } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

// Schema
export { AddressSchema } from './AddressSchema.js'
export { ChecksummedAddressSchema } from './ChecksummedAddressSchema.js'

// Effect-wrapped functions (don't throw, return Effect)
export const from = (input: string): Effect.Effect<AddressType, InvalidAddressError> =>
  Effect.try({
    try: () => VoltaireAddress(input),
    catch: (e) => e as InvalidAddressError
  })

export const fromBytes = (bytes: Uint8Array): Effect.Effect<AddressType, InvalidAddressError> =>
  Effect.try({
    try: () => VoltaireAddress.fromBytes(bytes),
    catch: (e) => e as InvalidAddressError
  })

export const toBytes = (addr: AddressType): Effect.Effect<Uint8Array> =>
  Effect.sync(() => VoltaireAddress.toBytes(addr))

export const toChecksummed = (addr: AddressType): Effect.Effect<string> =>
  Effect.sync(() => VoltaireAddress.toChecksummed(addr))

export const equals = (a: AddressType, b: AddressType): Effect.Effect<boolean> =>
  Effect.sync(() => VoltaireAddress.equals(a, b))
```

### Usage

```typescript
import { Address } from 'voltaire-effect'
import * as Effect from 'effect/Effect'

// Compose effects, errors accumulate in channel
const program = Effect.gen(function* () {
  const addr = yield* Address.from("0x1234...")
  const bytes = yield* Address.toBytes(addr)
  const checksummed = yield* Address.toChecksummed(addr)
  return { addr, bytes, checksummed }
})

// Run with error handling
Effect.runPromise(program)
  .then(console.log)
  .catch(console.error)

// Or pattern match on errors
const handled = program.pipe(
  Effect.catchTag("InvalidAddress", (e) => 
    Effect.succeed({ error: e.message })
  )
)
```

## Crypto Dependency Injection

Voltaire uses dependency injection for crypto (Address needs Keccak for checksum). Effect wraps this idiomatically with Layers:

### Keccak Service

```typescript
// voltaire-effect/src/crypto/Keccak256/KeccakService.ts
import { Keccak256 } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

// Service interface
export class KeccakService extends Context.Tag("KeccakService")<
  KeccakService,
  {
    readonly hash: (data: Uint8Array) => Effect.Effect<Uint8Array>
  }
>() {}

// Default implementation using Voltaire's Keccak
export const KeccakLive = Layer.succeed(KeccakService, {
  hash: (data) => Effect.sync(() => Keccak256.hash(data))
})

// Test implementation (deterministic, fast)
export const KeccakTest = Layer.succeed(KeccakService, {
  hash: (data) => Effect.sync(() => new Uint8Array(32)) // Mock
})
```

### Address with Keccak Dependency

```typescript
// voltaire-effect/src/primitives/Address/toChecksummed.ts
import { Address as VoltaireAddress, type AddressType } from '@tevm/voltaire'
import { KeccakService } from '../../crypto/Keccak256/KeccakService.js'
import * as Effect from 'effect/Effect'

// Requires KeccakService in context
export const toChecksummed = (
  addr: AddressType
): Effect.Effect<string, never, KeccakService> =>
  Effect.gen(function* () {
    const keccak = yield* KeccakService
    const hash = yield* keccak.hash(VoltaireAddress.toBytes(addr))
    return VoltaireAddress.toChecksummedWithHash(addr, hash)
  })

// Usage - must provide KeccakService layer
import { Address } from 'voltaire-effect'
import { KeccakLive } from 'voltaire-effect/crypto'

const program = Address.toChecksummed(myAddr).pipe(
  Effect.provide(KeccakLive)
)
```

### Secp256k1 Service

```typescript
// voltaire-effect/src/crypto/Secp256k1/Secp256k1Service.ts
import { Secp256k1 } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

export class Secp256k1Service extends Context.Tag("Secp256k1Service")<
  Secp256k1Service,
  {
    readonly sign: (hash: Uint8Array, privateKey: Uint8Array) => Effect.Effect<SignatureType>
    readonly recover: (hash: Uint8Array, signature: SignatureType) => Effect.Effect<PublicKeyType>
    readonly verify: (hash: Uint8Array, signature: SignatureType, publicKey: PublicKeyType) => Effect.Effect<boolean>
  }
>() {}

export const Secp256k1Live = Layer.succeed(Secp256k1Service, {
  sign: (hash, pk) => Effect.try(() => Secp256k1.sign(hash, pk)),
  recover: (hash, sig) => Effect.try(() => Secp256k1.recover(hash, sig)),
  verify: (hash, sig, pk) => Effect.sync(() => Secp256k1.verify(hash, sig, pk))
})
```

### Bundled Crypto Layer

```typescript
// voltaire-effect/src/crypto/CryptoLive.ts
import * as Layer from 'effect/Layer'
import { KeccakLive } from './Keccak256/KeccakService.js'
import { Secp256k1Live } from './Secp256k1/Secp256k1Service.js'
import { Blake2Live } from './Blake2/Blake2Service.js'
// ... all crypto services

// Single layer providing all crypto
export const CryptoLive = Layer.mergeAll(
  KeccakLive,
  Secp256k1Live,
  Blake2Live,
  // ...
)

// Usage - provide all crypto at once
const program = Effect.gen(function* () {
  const addr = yield* Address.from("0x...")
  const checksummed = yield* Address.toChecksummed(addr)
  const signed = yield* Transaction.sign(tx, privateKey)
  return { checksummed, signed }
}).pipe(Effect.provide(CryptoLive))
```

## Services Layer

### Transport Service (EIP-1193)

```typescript
// voltaire-effect/src/services/Eip1193/Eip1193Service.ts
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

export class Eip1193Service extends Context.Tag("Eip1193Service")<
  Eip1193Service,
  {
    readonly request: <T>(method: string, params?: unknown[]) => Effect.Effect<T, Eip1193Error>
  }
>() {}

// From window.ethereum (browser)
export const Eip1193Browser = Layer.effect(
  Eip1193Service,
  Effect.sync(() => ({
    request: <T>(method: string, params?: unknown[]) =>
      Effect.tryPromise({
        try: () => (window as any).ethereum.request({ method, params }) as Promise<T>,
        catch: (e) => new Eip1193Error(e)
      })
  }))
)

// From HTTP RPC endpoint
export const Eip1193Http = (url: string) => Layer.succeed(Eip1193Service, {
  request: <T>(method: string, params?: unknown[]) =>
    Effect.tryPromise({
      try: async () => {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
        })
        const json = await res.json()
        if (json.error) throw json.error
        return json.result as T
      },
      catch: (e) => new Eip1193Error(e)
    })
})

// From WebSocket
export const Eip1193WebSocket = (url: string) => Layer.effect(
  Eip1193Service,
  Effect.gen(function* () {
    // WebSocket connection setup...
    return {
      request: <T>(method: string, params?: unknown[]) => ...
    }
  })
)
```

### Provider Service

```typescript
// voltaire-effect/src/services/Provider/ProviderService.ts
import { type AddressType, type BlockType, type HexType } from '@tevm/voltaire'
import { Eip1193Service } from '../Eip1193/Eip1193Service.js'
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

export class ProviderService extends Context.Tag("ProviderService")<
  ProviderService,
  {
    readonly getBlockNumber: () => Effect.Effect<bigint, ProviderError>
    readonly getBalance: (address: AddressType) => Effect.Effect<bigint, ProviderError>
    readonly getBlock: (blockTag: BlockTag) => Effect.Effect<BlockType, ProviderError>
    readonly getTransaction: (hash: HexType) => Effect.Effect<TransactionType, ProviderError>
    readonly call: (tx: CallRequest) => Effect.Effect<HexType, ProviderError>
    readonly estimateGas: (tx: CallRequest) => Effect.Effect<bigint, ProviderError>
    readonly getCode: (address: AddressType) => Effect.Effect<HexType, ProviderError>
    readonly getStorageAt: (address: AddressType, slot: HexType) => Effect.Effect<HexType, ProviderError>
  }
>() {}

// Built on Eip1193Service
export const ProviderLive = Layer.effect(
  ProviderService,
  Effect.gen(function* () {
    const eip1193 = yield* Eip1193Service
    
    return {
      getBlockNumber: () => 
        eip1193.request<HexType>('eth_blockNumber').pipe(
          Effect.map((hex) => BigInt(hex))
        ),
      
      getBalance: (address) =>
        eip1193.request<HexType>('eth_getBalance', [address, 'latest']).pipe(
          Effect.map((hex) => BigInt(hex))
        ),
      
      getBlock: (blockTag) =>
        eip1193.request<BlockType>('eth_getBlockByNumber', [blockTag, true]),
      
      // ... rest of methods
    }
  })
)
```

### Signer Service

```typescript
// voltaire-effect/src/services/Signer/SignerService.ts
import { type AddressType, type HexType, type TransactionType } from '@tevm/voltaire'
import { Secp256k1Service } from '../../crypto/Secp256k1/Secp256k1Service.js'
import { KeccakService } from '../../crypto/Keccak256/KeccakService.js'
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

export class SignerService extends Context.Tag("SignerService")<
  SignerService,
  {
    readonly address: AddressType
    readonly signMessage: (message: HexType) => Effect.Effect<SignatureType, SignerError>
    readonly signTransaction: (tx: TransactionType) => Effect.Effect<SignedTransactionType, SignerError>
    readonly signTypedData: (typedData: TypedDataType) => Effect.Effect<SignatureType, SignerError>
  }
>() {}

// Private key signer - requires crypto services
export const SignerFromPrivateKey = (privateKey: HexType) => Layer.effect(
  SignerService,
  Effect.gen(function* () {
    const secp256k1 = yield* Secp256k1Service
    const keccak = yield* KeccakService
    
    // Derive address from private key
    const publicKey = yield* secp256k1.getPublicKey(privateKey)
    const address = yield* deriveAddress(publicKey, keccak)
    
    return {
      address,
      
      signMessage: (message) => Effect.gen(function* () {
        const hash = yield* keccak.hash(message)
        return yield* secp256k1.sign(hash, privateKey)
      }),
      
      signTransaction: (tx) => Effect.gen(function* () {
        const hash = yield* Transaction.hash(tx, keccak)
        const sig = yield* secp256k1.sign(hash, privateKey)
        return Transaction.withSignature(tx, sig)
      }),
      
      signTypedData: (typedData) => ...
    }
  })
)

// Eip1193 signer (browser wallet)
export const SignerFromEip1193 = Layer.effect(
  SignerService,
  Effect.gen(function* () {
    const eip1193 = yield* Eip1193Service
    const [address] = yield* eip1193.request<AddressType[]>('eth_accounts')
    
    return {
      address,
      signMessage: (message) => 
        eip1193.request<SignatureType>('personal_sign', [message, address]),
      signTransaction: (tx) =>
        eip1193.request<SignedTransactionType>('eth_signTransaction', [tx]),
      signTypedData: (typedData) =>
        eip1193.request<SignatureType>('eth_signTypedData_v4', [address, typedData])
    }
  })
)
```

### Wallet Service (Provider + Signer)

```typescript
// voltaire-effect/src/services/Wallet/WalletService.ts
import { ProviderService } from '../Provider/ProviderService.js'
import { SignerService } from '../Signer/SignerService.js'
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

export class WalletService extends Context.Tag("WalletService")<
  WalletService,
  {
    readonly address: AddressType
    readonly getBalance: () => Effect.Effect<bigint, WalletError>
    readonly sendTransaction: (tx: TransactionRequest) => Effect.Effect<HexType, WalletError>
    readonly signMessage: (message: HexType) => Effect.Effect<SignatureType, WalletError>
  }
>() {}

export const WalletLive = Layer.effect(
  WalletService,
  Effect.gen(function* () {
    const provider = yield* ProviderService
    const signer = yield* SignerService
    
    return {
      address: signer.address,
      
      getBalance: () => provider.getBalance(signer.address),
      
      sendTransaction: (tx) => Effect.gen(function* () {
        // Fill in missing fields
        const nonce = tx.nonce ?? (yield* provider.getTransactionCount(signer.address))
        const gasLimit = tx.gasLimit ?? (yield* provider.estimateGas(tx))
        
        const fullTx = { ...tx, nonce, gasLimit, from: signer.address }
        const signed = yield* signer.signTransaction(fullTx)
        return yield* provider.sendRawTransaction(signed)
      }),
      
      signMessage: (message) => signer.signMessage(message)
    }
  })
)
```

### Layer Composition

```typescript
// Full stack example
import { 
  Eip1193Http, 
  ProviderLive, 
  SignerFromPrivateKey, 
  WalletLive,
  CryptoLive 
} from 'voltaire-effect'

// Compose layers
const AppLive = WalletLive.pipe(
  Layer.provide(ProviderLive),
  Layer.provide(SignerFromPrivateKey(myPrivateKey)),
  Layer.provide(Eip1193Http("https://eth.llamarpc.com")),
  Layer.provide(CryptoLive)
)

// Run program with all dependencies
const program = Effect.gen(function* () {
  const wallet = yield* WalletService
  const balance = yield* wallet.getBalance()
  const txHash = yield* wallet.sendTransaction({
    to: recipientAddress,
    value: 1000000000000000000n
  })
  return { balance, txHash }
})

Effect.runPromise(program.pipe(Effect.provide(AppLive)))
```

### Account Service

```typescript
// voltaire-effect/src/services/Account/AccountService.ts
import { type AddressType, type HexType, type SignatureType } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

export class AccountService extends Context.Tag("AccountService")<
  AccountService,
  {
    readonly address: AddressType
    readonly type: 'local' | 'json-rpc' | 'hardware'
    readonly signMessage: (message: HexType) => Effect.Effect<SignatureType, AccountError>
    readonly signTransaction: (tx: UnsignedTransactionType) => Effect.Effect<SignatureType, AccountError>
    readonly signTypedData: (typedData: TypedDataType) => Effect.Effect<SignatureType, AccountError>
  }
>() {}

// Local account from private key
export const LocalAccount = (privateKey: HexType) => Layer.effect(
  AccountService,
  Effect.gen(function* () {
    const secp256k1 = yield* Secp256k1Service
    const keccak = yield* KeccakService
    const address = yield* deriveAddress(privateKey, secp256k1, keccak)
    
    return {
      address,
      type: 'local' as const,
      signMessage: (message) => Effect.gen(function* () {
        const hash = yield* keccak.hash(personalMessagePrefix(message))
        return yield* secp256k1.sign(hash, privateKey)
      }),
      signTransaction: (tx) => Effect.gen(function* () {
        const hash = yield* Transaction.signingHash(tx, keccak)
        return yield* secp256k1.sign(hash, privateKey)
      }),
      signTypedData: (typedData) => Effect.gen(function* () {
        const hash = yield* TypedData.hash(typedData, keccak)
        return yield* secp256k1.sign(hash, privateKey)
      })
    }
  })
)

// JSON-RPC account (browser wallet, uses EIP-1193)
export const JsonRpcAccount = (address: AddressType) => Layer.effect(
  AccountService,
  Effect.gen(function* () {
    const transport = yield* TransportService
    return {
      address,
      type: 'json-rpc' as const,
      signMessage: (message) => transport.request('personal_sign', [message, address]),
      signTransaction: (tx) => transport.request('eth_signTransaction', [{ ...tx, from: address }]),
      signTypedData: (typedData) => transport.request('eth_signTypedData_v4', [address, JSON.stringify(typedData)])
    }
  })
)

// Hardware account (Ledger, Trezor)
export const HardwareAccount = (derivationPath: string) => Layer.effect(
  AccountService,
  Effect.gen(function* () {
    const hardware = yield* HardwareWalletService
    const address = yield* hardware.getAddress(derivationPath)
    return {
      address,
      type: 'hardware' as const,
      signMessage: (message) => hardware.signMessage(derivationPath, message),
      signTransaction: (tx) => hardware.signTransaction(derivationPath, tx),
      signTypedData: (typedData) => hardware.signTypedData(derivationPath, typedData)
    }
  })
)
```

### PublicClient Service

```typescript
// voltaire-effect/src/services/PublicClient/PublicClientService.ts
// Read-only blockchain operations (like viem's PublicClient)

export class PublicClientService extends Context.Tag("PublicClientService")<
  PublicClientService,
  {
    // Block
    readonly getBlockNumber: () => Effect.Effect<bigint, PublicClientError>
    readonly getBlock: (args?: { blockTag?: BlockTag; blockHash?: HexType; includeTransactions?: boolean }) => Effect.Effect<BlockType, PublicClientError>
    readonly getBlockTransactionCount: (args: { blockTag?: BlockTag; blockHash?: HexType }) => Effect.Effect<number, PublicClientError>
    
    // Account
    readonly getBalance: (address: AddressType, blockTag?: BlockTag) => Effect.Effect<bigint, PublicClientError>
    readonly getTransactionCount: (address: AddressType, blockTag?: BlockTag) => Effect.Effect<number, PublicClientError>
    readonly getCode: (address: AddressType, blockTag?: BlockTag) => Effect.Effect<HexType, PublicClientError>
    readonly getStorageAt: (address: AddressType, slot: HexType, blockTag?: BlockTag) => Effect.Effect<HexType, PublicClientError>
    
    // Transaction
    readonly getTransaction: (hash: HexType) => Effect.Effect<TransactionType, PublicClientError>
    readonly getTransactionReceipt: (hash: HexType) => Effect.Effect<ReceiptType, PublicClientError>
    readonly waitForTransactionReceipt: (hash: HexType, opts?: { confirmations?: number; timeout?: number }) => Effect.Effect<ReceiptType, PublicClientError>
    
    // Call & Estimate
    readonly call: (tx: CallRequest, blockTag?: BlockTag) => Effect.Effect<HexType, PublicClientError>
    readonly estimateGas: (tx: CallRequest) => Effect.Effect<bigint, PublicClientError>
    readonly createAccessList: (tx: CallRequest) => Effect.Effect<AccessListType, PublicClientError>
    
    // Logs
    readonly getLogs: (filter: LogFilter) => Effect.Effect<LogType[], PublicClientError>
    
    // Chain
    readonly getChainId: () => Effect.Effect<number, PublicClientError>
    readonly getGasPrice: () => Effect.Effect<bigint, PublicClientError>
    readonly getMaxPriorityFeePerGas: () => Effect.Effect<bigint, PublicClientError>
    readonly getFeeHistory: (blockCount: number, newestBlock: BlockTag, rewardPercentiles: number[]) => Effect.Effect<FeeHistoryType, PublicClientError>
    
    // ENS (optional, may fail if not supported)
    readonly getEnsAddress: (name: string) => Effect.Effect<AddressType | null, PublicClientError>
    readonly getEnsName: (address: AddressType) => Effect.Effect<string | null, PublicClientError>
  }
>() {}

export const PublicClient = Layer.effect(
  PublicClientService,
  Effect.gen(function* () {
    const transport = yield* TransportService
    
    return {
      getBlockNumber: () => 
        transport.request<HexType>('eth_blockNumber').pipe(
          Effect.map(BigInt)
        ),
      
      getBalance: (address, blockTag = 'latest') =>
        transport.request<HexType>('eth_getBalance', [address, blockTag]).pipe(
          Effect.map(BigInt)
        ),
      
      getBlock: (args) => {
        const method = args?.blockHash 
          ? 'eth_getBlockByHash' 
          : 'eth_getBlockByNumber'
        const params = args?.blockHash
          ? [args.blockHash, args?.includeTransactions ?? false]
          : [args?.blockTag ?? 'latest', args?.includeTransactions ?? false]
        return transport.request<BlockType>(method, params)
      },
      
      call: (tx, blockTag = 'latest') =>
        transport.request<HexType>('eth_call', [tx, blockTag]),
      
      estimateGas: (tx) =>
        transport.request<HexType>('eth_estimateGas', [tx]).pipe(
          Effect.map(BigInt)
        ),
      
      waitForTransactionReceipt: (hash, opts) => Effect.gen(function* () {
        const timeout = opts?.timeout ?? 60000
        const confirmations = opts?.confirmations ?? 1
        const startTime = Date.now()
        
        while (Date.now() - startTime < timeout) {
          const receipt = yield* transport.request<ReceiptType | null>('eth_getTransactionReceipt', [hash])
          if (receipt) {
            const currentBlock = yield* transport.request<HexType>('eth_blockNumber')
            const receiptBlock = BigInt(receipt.blockNumber)
            if (BigInt(currentBlock) - receiptBlock >= BigInt(confirmations - 1)) {
              return receipt
            }
          }
          yield* Effect.sleep(1000)
        }
        return yield* Effect.fail(new PublicClientError('Transaction receipt timeout'))
      }),
      
      // ... rest of methods
    }
  })
)
```

### WalletClient Service

```typescript
// voltaire-effect/src/services/WalletClient/WalletClientService.ts
// Signing + sending operations (like viem's WalletClient)

export class WalletClientService extends Context.Tag("WalletClientService")<
  WalletClientService,
  {
    readonly account: AccountService
    
    // Signing
    readonly signMessage: (message: HexType) => Effect.Effect<SignatureType, WalletClientError>
    readonly signTransaction: (tx: TransactionRequest) => Effect.Effect<HexType, WalletClientError>
    readonly signTypedData: (typedData: TypedDataType) => Effect.Effect<SignatureType, WalletClientError>
    
    // Sending
    readonly sendTransaction: (tx: TransactionRequest) => Effect.Effect<HexType, WalletClientError>
    readonly sendRawTransaction: (signedTx: HexType) => Effect.Effect<HexType, WalletClientError>
    
    // Account management (JSON-RPC only)
    readonly requestAddresses: () => Effect.Effect<AddressType[], WalletClientError>
    readonly addChain: (chain: ChainConfig) => Effect.Effect<void, WalletClientError>
    readonly switchChain: (chainId: number) => Effect.Effect<void, WalletClientError>
    readonly watchAsset: (asset: WatchAssetParams) => Effect.Effect<boolean, WalletClientError>
  }
>() {}

export const WalletClient = Layer.effect(
  WalletClientService,
  Effect.gen(function* () {
    const account = yield* AccountService
    const publicClient = yield* PublicClientService
    const transport = yield* TransportService
    
    return {
      account,
      
      signMessage: (message) => account.signMessage(message),
      
      signTypedData: (typedData) => account.signTypedData(typedData),
      
      signTransaction: (tx) => Effect.gen(function* () {
        // Fill missing fields
        const nonce = tx.nonce ?? (yield* publicClient.getTransactionCount(account.address))
        const chainId = tx.chainId ?? (yield* publicClient.getChainId())
        const gasLimit = tx.gasLimit ?? (yield* publicClient.estimateGas(tx))
        
        // Get gas price (EIP-1559 or legacy)
        const gasParams = tx.maxFeePerGas 
          ? { maxFeePerGas: tx.maxFeePerGas, maxPriorityFeePerGas: tx.maxPriorityFeePerGas }
          : { gasPrice: tx.gasPrice ?? (yield* publicClient.getGasPrice()) }
        
        const fullTx = { ...tx, nonce, chainId, gasLimit, ...gasParams, from: account.address }
        const sig = yield* account.signTransaction(fullTx)
        return Transaction.serialize(fullTx, sig)
      }),
      
      sendTransaction: (tx) => Effect.gen(function* () {
        const signed = yield* WalletClientService.signTransaction(tx)
        return yield* transport.request<HexType>('eth_sendRawTransaction', [signed])
      }),
      
      sendRawTransaction: (signedTx) =>
        transport.request<HexType>('eth_sendRawTransaction', [signedTx]),
      
      requestAddresses: () =>
        transport.request<AddressType[]>('eth_requestAccounts'),
      
      switchChain: (chainId) =>
        transport.request<void>('wallet_switchEthereumChain', [{ chainId: `0x${chainId.toString(16)}` }]),
      
      // ... rest
    }
  })
)
```

### Contract Service

```typescript
// voltaire-effect/src/services/Contract/ContractService.ts
// Type-safe contract interaction (like viem's Contract)

import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import { Abi } from '@tevm/voltaire'

// Contract instance type - methods derived from ABI
export interface ContractInstance<TAbi extends AbiType> {
  readonly address: AddressType
  readonly abi: TAbi
  
  // Read methods (call)
  readonly read: {
    [K in ExtractReadMethods<TAbi>]: (
      ...args: AbiMethodArgs<TAbi, K>
    ) => Effect.Effect<AbiMethodReturn<TAbi, K>, ContractError>
  }
  
  // Write methods (send transaction)
  readonly write: {
    [K in ExtractWriteMethods<TAbi>]: (
      ...args: AbiMethodArgs<TAbi, K>
    ) => Effect.Effect<HexType, ContractError, WalletClientService>
  }
  
  // Simulate write (call without sending)
  readonly simulate: {
    [K in ExtractWriteMethods<TAbi>]: (
      ...args: AbiMethodArgs<TAbi, K>
    ) => Effect.Effect<AbiMethodReturn<TAbi, K>, ContractError>
  }
  
  // Events
  readonly getEvents: <E extends ExtractEvents<TAbi>>(
    eventName: E,
    filter?: EventFilter
  ) => Effect.Effect<DecodedEvent<TAbi, E>[], ContractError>
  
  readonly watchEvent: <E extends ExtractEvents<TAbi>>(
    eventName: E,
    callback: (event: DecodedEvent<TAbi, E>) => void
  ) => Effect.Effect<() => void, ContractError>
}

// Factory to create contract instances
export const Contract = <TAbi extends AbiType>(
  address: AddressType,
  abi: TAbi
): Effect.Effect<ContractInstance<TAbi>, never, PublicClientService> =>
  Effect.gen(function* () {
    const publicClient = yield* PublicClientService
    
    // Build read methods from ABI
    const readMethods = {} as ContractInstance<TAbi>['read']
    for (const item of abi) {
      if (item.type === 'function' && (item.stateMutability === 'view' || item.stateMutability === 'pure')) {
        readMethods[item.name] = (...args) => Effect.gen(function* () {
          const data = Abi.encodeFunctionData(abi, item.name, args)
          const result = yield* publicClient.call({ to: address, data })
          return Abi.decodeFunctionResult(abi, item.name, result)
        })
      }
    }
    
    // Build write methods (requires WalletClient in context when called)
    const writeMethods = {} as ContractInstance<TAbi>['write']
    for (const item of abi) {
      if (item.type === 'function' && item.stateMutability !== 'view' && item.stateMutability !== 'pure') {
        writeMethods[item.name] = (...args) => Effect.gen(function* () {
          const walletClient = yield* WalletClientService
          const data = Abi.encodeFunctionData(abi, item.name, args)
          return yield* walletClient.sendTransaction({ to: address, data })
        })
      }
    }
    
    return {
      address,
      abi,
      read: readMethods,
      write: writeMethods,
      simulate: /* similar to read but for write methods */,
      getEvents: (eventName, filter) => Effect.gen(function* () {
        const eventAbi = abi.find(item => item.type === 'event' && item.name === eventName)
        const topics = Abi.encodeEventTopics(eventAbi, filter)
        const logs = yield* publicClient.getLogs({ address, topics, ...filter })
        return logs.map(log => Abi.decodeEventLog(eventAbi, log))
      }),
      watchEvent: /* subscription or polling */
    }
  })
```

### Abi (Effect-Wrapped)

Voltaire's `Abi` module already handles encoding/decoding. Effect version just wraps in Effect:

```typescript
// voltaire-effect/src/primitives/Abi/index.ts
// Effect-wrapped Abi functions from @tevm/voltaire

import { Abi as VoltaireAbi, type AbiType, AbiError } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

// Encoding
export const encodeFunctionData = (
  abi: AbiType,
  functionName: string,
  args?: unknown[]
): Effect.Effect<HexType, AbiError> =>
  Effect.try({
    try: () => VoltaireAbi.encodeFunctionData(abi, functionName, args ?? []),
    catch: (e) => e as AbiError
  })

export const encodeEventTopics = (
  abi: AbiType,
  eventName: string,
  args?: unknown[]
): Effect.Effect<HexType[], AbiError> =>
  Effect.try({
    try: () => VoltaireAbi.encodeEventTopics(abi, eventName, args),
    catch: (e) => e as AbiError
  })

export const encodeDeployData = (
  abi: AbiType,
  bytecode: HexType,
  args?: unknown[]
): Effect.Effect<HexType, AbiError> =>
  Effect.try({
    try: () => VoltaireAbi.encodeDeployData(abi, bytecode, args ?? []),
    catch: (e) => e as AbiError
  })

// Decoding
export const decodeFunctionData = (
  abi: AbiType,
  data: HexType
): Effect.Effect<{ functionName: string; args: unknown[] }, AbiError> =>
  Effect.try({
    try: () => VoltaireAbi.decodeFunctionData(abi, data),
    catch: (e) => e as AbiError
  })

export const decodeFunctionResult = (
  abi: AbiType,
  functionName: string,
  data: HexType
): Effect.Effect<unknown, AbiError> =>
  Effect.try({
    try: () => VoltaireAbi.decodeFunctionResult(abi, functionName, data),
    catch: (e) => e as AbiError
  })

export const decodeEventLog = (
  abi: AbiType,
  log: { topics: HexType[]; data: HexType }
): Effect.Effect<{ eventName: string; args: unknown }, AbiError> =>
  Effect.try({
    try: () => VoltaireAbi.decodeEventLog(abi, log),
    catch: (e) => e as AbiError
  })

export const decodeErrorResult = (
  abi: AbiType,
  data: HexType
): Effect.Effect<{ errorName: string; args: unknown[] }, AbiError> =>
  Effect.try({
    try: () => VoltaireAbi.decodeErrorResult(abi, data),
    catch: (e) => e as AbiError
  })

// Fragment access
export const getFunction = (
  abi: AbiType,
  nameOrSig: string
): Effect.Effect<FunctionFragment, AbiError> =>
  Effect.try({
    try: () => VoltaireAbi.getFunction(abi, nameOrSig),
    catch: (e) => e as AbiError
  })

export const getEvent = (
  abi: AbiType,
  nameOrSig: string
): Effect.Effect<EventFragment, AbiError> =>
  Effect.try({
    try: () => VoltaireAbi.getEvent(abi, nameOrSig),
    catch: (e) => e as AbiError
  })
```

Usage matches Voltaire's data-first pattern:

```typescript
import { Abi } from 'voltaire-effect'
import * as Effect from 'effect/Effect'

const program = Effect.gen(function* () {
  const data = yield* Abi.encodeFunctionData(erc20Abi, 'transfer', [to, amount])
  const result = yield* Abi.decodeFunctionResult(erc20Abi, 'balanceOf', returnData)
  return { data, result }
})
```

### Testing with Mock Layers

```typescript
// Test layers
const ProviderTest = Layer.succeed(ProviderService, {
  getBlockNumber: () => Effect.succeed(12345n),
  getBalance: () => Effect.succeed(1000000000000000000n),
  // ... mock implementations
})

const SignerTest = Layer.succeed(SignerService, {
  address: "0x1234..." as AddressType,
  signMessage: () => Effect.succeed(mockSignature),
  signTransaction: () => Effect.succeed(mockSignedTx),
  signTypedData: () => Effect.succeed(mockSignature)
})

// Test composition
const TestLive = WalletLive.pipe(
  Layer.provide(ProviderTest),
  Layer.provide(SignerTest)
)

// Tests run without network, without real crypto
Effect.runPromise(program.pipe(Effect.provide(TestLive)))
```

## Documentation Site

Simple Astro site with minimal styling. No framework bloat.

### Stack
- **Framework**: Astro (static site)
- **Styling**: Plain CSS, black on white / white on black
- **No**: Tailwind, component libraries, complex theming

### Structure
```
voltaire-effect/
├── docs/
│   ├── src/
│   │   ├── content/
│   │   │   ├── config.ts
│   │   │   └── docs/
│   │   │       ├── index.md
│   │   │       ├── getting-started.md
│   │   │       ├── primitives/
│   │   │       │   ├── address.md
│   │   │       │   ├── hex.md
│   │   │       │   └── ...
│   │   │       ├── crypto/
│   │   │       │   ├── keccak256.md
│   │   │       │   └── ...
│   │   │       ├── services/
│   │   │       │   ├── provider.md
│   │   │       │   ├── wallet.md
│   │   │       │   └── eip1193.md
│   │   │       └── layers.md
│   │   ├── pages/
│   │   │   └── [...slug].astro
│   │   ├── layouts/
│   │   │   └── Base.astro
│   │   └── styles/
│   │       └── global.css
│   ├── astro.config.mjs
│   └── package.json
```

### Styling (global.css)
```css
:root {
  --bg: #fff;
  --fg: #000;
  --code-bg: #f5f5f5;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #000;
    --fg: #fff;
    --code-bg: #1a1a1a;
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, sans-serif;
  background: var(--bg);
  color: var(--fg);
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

a {
  color: var(--fg);
}

code {
  background: var(--code-bg);
  padding: 0.2em 0.4em;
  font-family: ui-monospace, monospace;
}

pre {
  background: var(--code-bg);
  padding: 1rem;
  overflow-x: auto;
}

pre code {
  background: none;
  padding: 0;
}

h1, h2, h3 {
  margin-top: 2rem;
  margin-bottom: 1rem;
}

p, ul, ol, pre {
  margin-bottom: 1rem;
}

nav {
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--fg);
  padding-bottom: 1rem;
}

nav a {
  margin-right: 1rem;
}
```

### Base Layout (Base.astro)
```astro
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} | voltaire-effect</title>
  <link rel="stylesheet" href="/styles/global.css">
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/getting-started">Getting Started</a>
    <a href="/primitives/address">Primitives</a>
    <a href="/crypto/keccak256">Crypto</a>
    <a href="/services/provider">Services</a>
    <a href="/layers">Layers</a>
  </nav>
  <main>
    <slot />
  </main>
</body>
</html>
```

### Content Collection Config (content/config.ts)
```typescript
import { defineCollection, z } from 'astro:content'

const docs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    order: z.number().optional(),
  }),
})

export const collections = { docs }
```

### Dynamic Page ([...slug].astro)
```astro
---
import { getCollection } from 'astro:content'
import Base from '../layouts/Base.astro'

export async function getStaticPaths() {
  const docs = await getCollection('docs')
  return docs.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }))
}

const { entry } = Astro.props
const { Content } = await entry.render()
---
<Base title={entry.data.title}>
  <Content />
</Base>
```

### Example Markdown (content/docs/primitives/address.md)
```markdown
---
title: Address
order: 1
---

# Address

## Schema

\`\`\`typescript
import { Address } from 'voltaire-effect'
import * as Schema from 'effect/Schema'

const addr = Schema.decodeSync(Address.Schema)("0x...")
\`\`\`

## Effect Functions

\`\`\`typescript
import { Address } from 'voltaire-effect'
import * as Effect from 'effect/Effect'

const program = Effect.gen(function* () {
  const addr = yield* Address.from("0x...")
  const checksummed = yield* Address.toChecksummed(addr)
  return checksummed
})
\`\`\`

## Requires

`Address.toChecksummed` requires `KeccakService` in context.

\`\`\`typescript
import { KeccakLive } from 'voltaire-effect/crypto'

const result = program.pipe(Effect.provide(KeccakLive))
\`\`\`
```

## CI/CD & Publishing

### Package Configuration (package.json)
```json
{
  "name": "voltaire-effect",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./primitives": "./dist/primitives/index.js",
    "./crypto": "./dist/crypto/index.js",
    "./services": "./dist/services/index.js"
  },
  "peerDependencies": {
    "@tevm/voltaire": "^0.x.x",
    "effect": "^3.x.x"
  },
  "devDependencies": {
    "vitest": "^2.x.x",
    "typescript": "^5.x.x",
    "tsup": "^8.x.x"
  },
  "scripts": {
    "build": "tsup",
    "test": "vitest",
    "test:run": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "biome lint src/",
    "format": "biome format src/",
    "docs:dev": "cd docs && astro dev",
    "docs:build": "cd docs && astro build"
  }
}
```

### GitHub Actions - CI (.github/workflows/voltaire-effect-ci.yml)
```yaml
name: voltaire-effect CI

on:
  push:
    paths:
      - 'voltaire-effect/**'
  pull_request:
    paths:
      - 'voltaire-effect/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Typecheck
        run: pnpm --filter voltaire-effect typecheck
      
      - name: Lint
        run: pnpm --filter voltaire-effect lint
      
      - name: Test
        run: pnpm --filter voltaire-effect test:run
      
      - name: Build
        run: pnpm --filter voltaire-effect build

  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build docs
        run: pnpm --filter voltaire-effect docs:build
```

### GitHub Actions - Publish (.github/workflows/voltaire-effect-publish.yml)
```yaml
name: voltaire-effect Publish

on:
  push:
    tags:
      - 'voltaire-effect@*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm --filter voltaire-effect build
      
      - name: Publish
        run: pnpm --filter voltaire-effect publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  deploy-docs:
    runs-on: ubuntu-latest
    needs: publish
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build docs
        run: pnpm --filter voltaire-effect docs:build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./voltaire-effect/docs/dist
```

### Workspace Integration (pnpm-workspace.yaml)
```yaml
packages:
  - '.'
  - 'voltaire-effect'
```

## Development Workflow

### Documentation-Driven, Test-Driven Development

Every feature follows this order:

1. **Write docs first** - Create/update markdown doc describing the API
2. **Write tests** - Tests based on documented behavior
3. **Implement** - Code to pass tests
4. **Verify** - Run tests, typecheck, docs build

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Write Doc  │ ──► │ Write Tests │ ──► │ Implement   │ ──► │   Verify    │
│  (*.md)     │     │ (*.test.ts) │     │   (*.ts)    │     │ (CI passes) │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Example: Adding Address.fromBytes

**Step 1: Write doc** (content/docs/primitives/address.md)
```markdown
## fromBytes

Creates an Address from a 20-byte Uint8Array.

\`\`\`typescript
import { Address } from 'voltaire-effect'

const program = Address.fromBytes(new Uint8Array(20))
// Effect.Effect<AddressType, InvalidAddressError>
\`\`\`
```

**Step 2: Write test** (src/primitives/Address/fromBytes.test.ts)
```typescript
import { describe, it, expect } from 'vitest'
import { Address } from './index.js'
import * as Effect from 'effect/Effect'

describe('Address.fromBytes', () => {
  it('creates address from 20 bytes', async () => {
    const bytes = new Uint8Array(20).fill(0xab)
    const result = await Effect.runPromise(Address.fromBytes(bytes))
    expect(result).toBe('0xabababababababababababababababababababab')
  })

  it('fails for wrong length', async () => {
    const bytes = new Uint8Array(19)
    const result = await Effect.runPromiseExit(Address.fromBytes(bytes))
    expect(result._tag).toBe('Failure')
  })
})
```

**Step 3: Implement** (src/primitives/Address/fromBytes.ts)
```typescript
import { Address as VoltaireAddress, InvalidAddressError } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

export const fromBytes = (bytes: Uint8Array) =>
  Effect.try({
    try: () => VoltaireAddress.fromBytes(bytes),
    catch: (e) => e as InvalidAddressError
  })
```

**Step 4: Verify**
```bash
pnpm --filter voltaire-effect test:run
pnpm --filter voltaire-effect typecheck
pnpm --filter voltaire-effect docs:build
```

### Parallel Agent Workflow

For bulk implementation, deploy parallel agents:

```
Agent 1: primitives/Address (doc → test → impl)
Agent 2: primitives/Hex (doc → test → impl)
Agent 3: primitives/Hash (doc → test → impl)
...
Agent 16: crypto/Secp256k1 (doc → test → impl)
```

Each agent:
1. Creates markdown doc for module
2. Creates test file based on doc
3. Implements to pass tests
4. Runs `pnpm test:run` and `pnpm typecheck`

## Migration Strategy

### Phase 1: Fix Voltaire Errors (IN PROGRESS)
16 parallel agents fixing all Voltaire errors to use VoltaireError base class with typed errors.

**Modules being fixed:**
- Primitives: ~156 modules (Abi, AccessList, Address, Block, etc.)
- Crypto: ~20 modules (AesGcm, Bip39, Blake2, Keccak256, etc.)

### Phase 2: Create voltaire-effect Package
1. Initialize package with peer dep on @tevm/voltaire
2. Create Schema wrappers for all primitives
3. Create Service layers for Provider, Wallet, Eip1193
4. Write Mintlify docs site

### Phase 3: Documentation-Driven Development
- All work done in parallel with documentation
- Docs serve as spec
- Tests written alongside schemas
- User reviews and approves each doc page

## Implementation Notes

### Branded Type Handling
Since Voltaire uses branded Uint8Array/string types:
```typescript
type HexType = `0x${string}` & { readonly __tag: "Hex" }
```

The Schema output IS the branded type - no conversion needed:
```typescript
const hex: HexType = Schema.decodeSync(HexSchema)("0x1234")
Hex.toBytes(hex) // Works directly with Voltaire functions
```

### Encoding
Since branded types ARE their underlying type at runtime, encoding is trivial:
```typescript
encode: (h: HexType) => ParseResult.succeed(h)
// HexType is already a string, just return it
```

### Error Passthrough
Voltaire errors flow through to Effect ParseError:
```typescript
decode: (s) => {
  try {
    return ParseResult.succeed(Hex(s))
  } catch (e) {
    // e is InvalidHexError with _tag, input, message
    return ParseResult.fail(new ParseResult.Type(ast, s, e.message))
  }
}
```
