# voltaire-effect Implementation Prompt

## Objective

Implement `voltaire-effect`, a complete Effect.ts integration library for Voltaire's Ethereum primitives. This library provides Effect Schemas for validation, Effect-wrapped functions that never throw, and Effect Services with dependency injection for higher-level abstractions.

## Prerequisites

- Read the full design specification: `/Users/williamcory/voltaire/VOLTAIRE-EFFECT-DESIGN.md`
- Understand Voltaire's existing primitives: `/Users/williamcory/voltaire/src/primitives/`
- Understand Voltaire's existing crypto: `/Users/williamcory/voltaire/src/crypto/`
- Understand Effect.ts patterns: Schema, Effect, Layer, Context.Tag

## Critical Requirements

### Review Policy
If ANY implementation already exists, you MUST:
1. Fully review all existing code for correctness and idiomatic Effect patterns
2. Verify test coverage is extensive (edge cases, error paths, integration scenarios)
3. Add missing tests - aim for comprehensive coverage of every exported function
4. Fix any bugs, type errors, or non-idiomatic patterns
5. Ensure documentation matches implementation

### Development Workflow
Follow documentation-driven, test-driven development for ALL work:
1. **Write docs first** - Create/update markdown doc describing the API
2. **Write tests** - Tests based on documented behavior, including edge cases and error scenarios
3. **Implement** - Code to pass tests
4. **Verify** - Run tests, typecheck, docs build

## Package Structure

```
voltaire-effect/
├── package.json              # name: "voltaire-effect", peer deps: @tevm/voltaire, effect
├── tsconfig.json
├── tsup.config.ts
├── src/
│   ├── index.ts              # Main exports
│   ├── primitives/           # All Voltaire primitives wrapped
│   ├── crypto/               # All Voltaire crypto as Services
│   └── services/             # High-level abstractions
└── docs/                     # Astro site with markdown content
```

## Core Patterns

### Schema Pattern
Wrap Voltaire constructors with `Schema.transformOrFail`:

```typescript
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
          return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
        }
      },
      encode: (h) => ParseResult.succeed(h)
    }
  )
```

### Effect Function Pattern
Wrap all throwing functions in Effect:

```typescript
import { Hex as VoltaireHex, InvalidHexError } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

export const from = (input: string): Effect.Effect<HexType, InvalidHexError> =>
  Effect.try({
    try: () => VoltaireHex(input),
    catch: (e) => e as InvalidHexError
  })

// For functions that can't fail
export const size = (hex: HexType): Effect.Effect<number> =>
  Effect.sync(() => VoltaireHex.size(hex))
```

### Service Pattern
Use Context.Tag for dependency injection:

```typescript
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

export class KeccakService extends Context.Tag("KeccakService")<
  KeccakService,
  {
    readonly hash: (data: Uint8Array) => Effect.Effect<Uint8Array>
  }
>() {}

export const KeccakLive = Layer.succeed(KeccakService, {
  hash: (data) => Effect.sync(() => Keccak256.hash(data))
})
```

### Functions Requiring Services
Some functions need crypto services in context:

```typescript
export const toChecksummed = (
  addr: AddressType
): Effect.Effect<string, never, KeccakService> =>
  Effect.gen(function* () {
    const keccak = yield* KeccakService
    const hash = yield* keccak.hash(Address.toBytes(addr))
    return Address.toChecksummedWithHash(addr, hash)
  })
```

## Complete API Reference

### Primitives (134 modules)

Every primitive from `@tevm/voltaire` needs Effect versions:

**Core Types:**
- Hex, Bytes, Bytes32, Address, Hash
- Uint8, Uint16, Uint32, Uint64, Uint128, Uint, U256
- Int8, Int16, Int32, Int64, Int128, Int256

**Transaction & Block:**
- Transaction, TransactionHash, TransactionIndex, TransactionStatus, TransactionUrl
- Block, BlockBody, BlockHeader, BlockHash, BlockNumber, BlockFilter
- Receipt, CallTrace, TraceConfig, TraceResult, StructLog, OpStep
- Signature, SignedData

**Account & State:**
- AccountState, State, StateDiff, StateProof, StateRoot
- Storage, StorageDiff, StorageProof, StorageValue
- PrivateKey, PublicKey, Nonce, Balance (via Denomination)

**Gas & Fees:**
- Gas, GasPrice, GasEstimate, GasUsed, GasRefund, GasConstants, GasCosts
- BaseFeePerGas, MaxFeePerGas, MaxPriorityFeePerGas, EffectiveGasPrice
- FeeMarket, FeeOracle

**ABI & Encoding:**
- Abi, CallData, ReturnData, RevertReason
- FunctionSignature, EventSignature, ErrorSignature, Selector
- EncodedData, DecodedData, TypedData, DomainSeparator, Domain
- Rlp, Ssz, Base64

**Logs & Events:**
- EventLog, LogFilter, LogIndex, TopicFilter, FilterId
- BloomFilter

**Contract:**
- Bytecode, ContractCode, RuntimeCode, InitCode
- ContractResult, ContractSignature, Proxy

**Chain & Network:**
- Chain, ChainId, ChainHead, NetworkId, ProtocolVersion
- Hardfork, ForkId, SyncStatus
- NodeInfo, PeerId, PeerInfo

**EIP-4337 (Account Abstraction):**
- UserOperation, PackedUserOperation
- Paymaster, EntryPoint, Bundler, BundleHash, Bundle

**EIP-4844 (Blobs):**
- Blob, BeaconBlockRoot

**EIP-7702 (Authorization):**
- Authorization

**Merkle & Proofs:**
- MerkleTree, BinaryTree, Proof

**Identity & Auth:**
- Ens, Siwe, StealthAddress, Permit, ForwardRequest, RelayData

**Tokens:**
- TokenId, MultiTokenId, TokenBalance

**Access Lists:**
- AccessList

**Validators & Consensus:**
- ValidatorIndex, Epoch, BuilderBid
- Withdrawal, WithdrawalIndex, Uncle

**Misc:**
- Slot, Metadata, License, CompilerVersion, SourceMap, MemoryDump, Keystore

### Crypto Services (20 modules)

Every crypto module needs Service + Live Layer + Test Layer:

**Hashing:**
- Keccak256
- SHA256
- Blake2
- Ripemd160

**Signing & Verification:**
- Secp256k1
- Ed25519
- P256 (secp256r1)
- BLS12381
- bn254

**Key Derivation:**
- HDWallet
- Bip39
- HMAC

**Encryption:**
- AesGcm
- ChaCha20Poly1305
- X25519

**EVM-Specific:**
- KZG (EIP-4844)
- ModExp (precompile)
- EIP712 (typed data hashing)
- Keystore

**Signers:**
- signers (abstract signer interface)

**Bundle Layer:**
- CryptoLive = Layer.mergeAll(KeccakLive, Secp256k1Live, Blake2Live, ...)

### Services (5 modules)

High-level abstractions built on primitives and crypto:

**TransportService** - EIP-1193 base layer
```typescript
export class TransportService extends Context.Tag("TransportService")<
  TransportService,
  {
    readonly request: <T>(method: string, params?: unknown[]) => Effect.Effect<T, TransportError>
  }
>() {}

// Layers
export const HttpTransport = (url: string) => Layer.succeed(...)
export const WebSocketTransport = (url: string) => Layer.effect(...)
export const BrowserTransport = Layer.effect(...) // window.ethereum
```

**PublicClientService** - Read-only blockchain operations
```typescript
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
    
    // ENS
    readonly getEnsAddress: (name: string) => Effect.Effect<AddressType | null, PublicClientError>
    readonly getEnsName: (address: AddressType) => Effect.Effect<string | null, PublicClientError>
  }
>() {}
```

**AccountService** - Signing identity
```typescript
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

// Layers
export const LocalAccount = (privateKey: HexType) => Layer.effect(...) // Requires Secp256k1Service, KeccakService
export const JsonRpcAccount = (address: AddressType) => Layer.effect(...) // Requires TransportService
export const HardwareAccount = (derivationPath: string) => Layer.effect(...) // Requires HardwareWalletService
```

**WalletClientService** - Signing + sending
```typescript
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
    
    // Account management
    readonly requestAddresses: () => Effect.Effect<AddressType[], WalletClientError>
    readonly addChain: (chain: ChainConfig) => Effect.Effect<void, WalletClientError>
    readonly switchChain: (chainId: number) => Effect.Effect<void, WalletClientError>
    readonly watchAsset: (asset: WatchAssetParams) => Effect.Effect<boolean, WalletClientError>
  }
>() {}

// Requires AccountService, PublicClientService, TransportService
export const WalletClientLive = Layer.effect(...)
```

**Contract** - Type-safe contract interaction
```typescript
export interface ContractInstance<TAbi extends AbiType> {
  readonly address: AddressType
  readonly abi: TAbi
  
  readonly read: {
    [K in ExtractReadMethods<TAbi>]: (...args: AbiMethodArgs<TAbi, K>) => Effect.Effect<AbiMethodReturn<TAbi, K>, ContractError>
  }
  
  readonly write: {
    [K in ExtractWriteMethods<TAbi>]: (...args: AbiMethodArgs<TAbi, K>) => Effect.Effect<HexType, ContractError, WalletClientService>
  }
  
  readonly simulate: {
    [K in ExtractWriteMethods<TAbi>]: (...args: AbiMethodArgs<TAbi, K>) => Effect.Effect<AbiMethodReturn<TAbi, K>, ContractError>
  }
  
  readonly getEvents: <E extends ExtractEvents<TAbi>>(eventName: E, filter?: EventFilter) => Effect.Effect<DecodedEvent<TAbi, E>[], ContractError>
  
  readonly watchEvent: <E extends ExtractEvents<TAbi>>(eventName: E, callback: (event: DecodedEvent<TAbi, E>) => void) => Effect.Effect<() => void, ContractError>
}

export const Contract = <TAbi extends AbiType>(
  address: AddressType,
  abi: TAbi
): Effect.Effect<ContractInstance<TAbi>, never, PublicClientService> => ...
```

## Documentation Site

Simple Astro site with markdown content:
- Minimal CSS (black/white, prefers-color-scheme for dark mode)
- No Tailwind or component libraries
- Content collections for markdown docs
- Structure mirrors code structure
- Every exported API must be documented

## Test Requirements

**Tests must be extensive.** For each module:
- Happy path for every exported function
- Error cases and edge cases
- Invalid inputs
- Boundary conditions
- Service layer integration tests
- Schema encoding/decoding round-trips
- Effect error channel verification (errors in channel, not thrown)

Run tests: `pnpm --filter voltaire-effect test:run`
Run typecheck: `pnpm --filter voltaire-effect typecheck`

## CI/CD

GitHub Actions workflows:
- CI: typecheck, lint, test, build, docs build on push/PR
- Publish: npm publish + docs deploy on tag `voltaire-effect@*`

## Getting Started

1. Read the design doc thoroughly
2. Explore existing Voltaire code to understand what needs wrapping
3. If implementation exists, review it completely before proceeding
4. Follow doc → test → implement → verify workflow
5. Use parallel agents for independent modules
6. Run full test suite frequently to catch regressions
