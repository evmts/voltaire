# Viem Parity - Missing Features & Extensibility

<issue>
<metadata>
priority: P0
type: planning-document
scope: full-library
status: master-planning
created: 2026-01-25
updated: 2026-01-25
</metadata>

<executive_summary>
Comprehensive gap analysis comparing viem's client architecture against voltaire-effect. This master document consolidates findings from 30+ reviews (078-092, VIEM-COMPARISON-SUMMARY) into actionable implementation categories.

**Key Stats:**
- EIP compliance: ~60% → target 90%
- RPC methods: ~65% → target 95%
- Wallet actions: ~50% → target 90%
- L2 support: ~30% → target 80%
- Signature utilities: ~20% → target 90%

**Naming Convention:** We use ethers-style naming:
- `ProviderService` / `Provider` = viem's PublicClient (read-only)
- `SignerService` / `Signer` = viem's WalletClient (signs & sends)
</executive_summary>

<gap_categories>

<category name="Transport Layer">
<priority>P0</priority>
<gaps>
- No `fetchOptions` in HttpTransport (can't add auth headers)
- No fallback transport ranking/latency tracking
- No `ipc()` transport for local nodes
- No `custom()` transport for EIP-1193 provider wrapping
- No `onFetchRequest`/`onFetchResponse` hooks
- No request deduplication
- No automatic JSON-RPC batching
- FallbackTransport has mutable state bug (review 075)
- WebSocketTransport uses Effect.runSync in callbacks (review 073)
</gaps>
<viem_ref>
- `src/clients/transports/http.ts` - fetchOptions, onRequest/Response
- `src/clients/transports/fallback.ts` - ranking, retryDelay
- `src/clients/transports/ipc.ts` - IPC support
- `src/clients/transports/custom.ts` - EIP-1193 wrapper
</viem_ref>
<effect_solution>
```typescript
// HttpTransport with fetchOptions
const HttpTransport = (url: string, config?: {
  fetchOptions?: RequestInit
  onRequest?: (req: RpcRequest) => Effect.Effect<void>
  onResponse?: (res: RpcResponse) => Effect.Effect<void>
}): Layer.Layer<TransportService> => ...

// Use FiberRef for request/response interceptors
const onRequestRef = FiberRef.unsafeMake<(req: RpcRequest) => Effect.Effect<void>>(() => Effect.void)

// Fallback with Ref for mutable state
const instancesRef = yield* Ref.make(transports.map(...))

// Use Effect.request for automatic batching
const GetBalanceRequest = Data.TaggedClass("GetBalance")<{...}>
const resolver = RequestResolver.makeBatched((requests) => ...)
```
</effect_solution>
<implementation_steps>
1. Add `fetchOptions` to HttpTransport config
2. Add FiberRef-based interceptors for request/response hooks
3. Fix FallbackTransport mutable array → use Ref
4. Fix WebSocketTransport → use Runtime.runFork in callbacks
5. Add request deduplication via Effect.cached
6. Add JSON-RPC batching via Effect.request + RequestResolver
7. Add IpcTransport for local nodes
8. Add CustomTransport for EIP-1193 providers
</implementation_steps>
</category>

<category name="Chain Configuration">
<priority>P0</priority>
<gaps>
- No `chain.formatters` (pluggable block/tx/receipt transformers)
- No `chain.serializers` (custom transaction encoding)
- No `chain.fees` (custom gas estimation per chain)
- No `chain.prepareTransactionRequest` (pre-signing hooks)
- No L2-specific formatters (OP Stack, Arbitrum, zkSync, Celo)
</gaps>
<viem_ref>
- `src/types/chain.ts` - Chain definition with formatters
- `src/chains/definitions/*.ts` - Per-chain configs
- `src/chains/formatters/*.ts` - L2 formatters
</viem_ref>
<effect_solution>
```typescript
// ChainFormatterService - pluggable data transformers
class ChainFormatterService extends Context.Tag("ChainFormatterService")<
  ChainFormatterService,
  {
    readonly formatBlock: (raw: RpcBlock) => Effect.Effect<Block, FormatError>
    readonly formatTransaction: (raw: RpcTx) => Effect.Effect<Transaction, FormatError>
    readonly formatReceipt: (raw: RpcReceipt) => Effect.Effect<Receipt, FormatError>
    readonly formatRequest: (req: TxRequest) => Effect.Effect<RpcTxRequest, FormatError>
  }
>() {}

// ChainSerializerService - pluggable encoding
class ChainSerializerService extends Context.Tag("ChainSerializerService")<...>() {}

// ChainFeesService - pluggable gas estimation
class ChainFeesService extends Context.Tag("ChainFeesService")<...>() {}

// Swap via Layer.provide per chain
const CeloProvider = Provider.pipe(Layer.provide(CeloChainFormatter))
```
</effect_solution>
<implementation_steps>
1. Create ChainFormatterService with default implementation
2. Create ChainSerializerService with default implementation
3. Create ChainFeesService with default implementation
4. Update Provider to consume formatter service
5. Create OP Stack formatter/serializer/fees layers
6. Create Arbitrum formatter/serializer/fees layers
7. Create Celo formatter (custom fields) layer
8. Create zkSync formatter/serializer/fees layers
</implementation_steps>
</category>

<category name="Provider Methods">
<priority>P0</priority>
<gaps>
**Simulation:**
- No `stateOverride` in call/estimateGas
- No `simulateCalls` with asset changes
- No `blockOverrides` support

**Contract:**
- No `simulateContract` (call + ABI decode)
- No `multicall` (batch via Multicall3)
- No `Contract.estimateGas` per method
- No `deployContract` helper

**ENS:**
- No `getEnsAddress` / `getEnsName` / `getEnsResolver`
- No `getEnsAvatar` / `getEnsText`

**Subscriptions:**
- No `watchEvent` / `watchContractEvent`
- No `watchPendingTransactions`
- No filter-based subscriptions (eth_newFilter)

**Misc:**
- No `getProof` (eth_getProof for Merkle proofs)
- No `getBlobBaseFee` (EIP-4844)
- No `getTransactionConfirmations`
</gaps>
<viem_ref>
- `src/actions/public/*.ts` - All public actions
- `src/actions/wallet/*.ts` - All wallet actions
- `src/contract.ts` - Contract helpers
</viem_ref>
<effect_solution>
```typescript
// State override in call
readonly call: (params: {
  to: Address
  data?: Hex
  stateOverride?: StateOverride
  blockOverrides?: BlockOverrides
}) => Effect.Effect<Hex, CallError>

// Multicall via Multicall3
class MulticallService extends Context.Tag("MulticallService")<...>()

// Event subscriptions via Effect Stream
readonly watchEvent: <TAbi>(params: {
  abi: TAbi
  eventName: string
}) => Stream.Stream<Log, WatchError>

// Contract.estimateGas
Contract.estimateGas(contract, "transfer", [to, amount])
```
</effect_solution>
<implementation_steps>
1. Add stateOverride/blockOverrides to call/estimateGas
2. Implement simulateContract (call + decode)
3. Implement MulticallService with Multicall3 support
4. Implement Contract.estimateGas helper
5. Add deployContract to SignerService
6. Add ENS resolution methods
7. Implement watchEvent/watchContractEvent via Stream
8. Add filter-based subscription methods
9. Add getProof, getBlobBaseFee, getTransactionConfirmations
</implementation_steps>
</category>

<category name="Signer/Wallet Actions">
<priority>P1</priority>
<gaps>
**EIP-7702:**
- No `signAuthorization` (code delegation)
- No `prepareAuthorization`

**Wallet Management:**
- No `addChain` (EIP-3085)
- No `switchChain`
- No `watchAsset` (EIP-747)
- No `getPermissions` / `requestPermissions` (EIP-2255)
- No `getAddresses` (non-prompting)

**Contract:**
- No `writeContract` with simulation
- No `deployContract` helper
</gaps>
<viem_ref>
- `src/actions/wallet/*.ts` - Wallet actions
- `src/experimental/eip7702/*.ts` - EIP-7702 support
</viem_ref>
<effect_solution>
```typescript
// EIP-7702 authorization
readonly signAuthorization: (params: {
  contractAddress: Address
  chainId: number
  nonce?: number
}) => Effect.Effect<SignedAuthorization, SignError>

// Wallet management
readonly addChain: (chain: Chain) => Effect.Effect<void, WalletError>
readonly switchChain: (chainId: number) => Effect.Effect<void, WalletError>
readonly watchAsset: (asset: WatchAssetParams) => Effect.Effect<boolean, WalletError>
```
</effect_solution>
<implementation_steps>
1. Implement signAuthorization for EIP-7702
2. Add addChain (EIP-3085)
3. Add switchChain
4. Add watchAsset (EIP-747)
5. Add getPermissions/requestPermissions (EIP-2255)
6. Add getAddresses (non-prompting variant)
7. Add deployContract helper
</implementation_steps>
</category>

<category name="Account System">
<priority>P1</priority>
<gaps>
- No `Account.sign({ hash })` for raw hash signing
- No `Account.publicKey` property
- No HD derivation options (child account derivation)
- No `toAccount` factory for custom signing
- No ERC-6492 signature support (smart account counterfactual)
- LocalAccount has no memory cleanup for private keys
</gaps>
<viem_ref>
- `src/accounts/types.ts` - Account interface
- `src/accounts/*.ts` - Account implementations
</viem_ref>
<effect_solution>
```typescript
// Account with publicKey and sign({ hash })
interface AccountShape {
  readonly address: AddressType
  readonly publicKey?: Hex
  readonly signMessage: (message: Hex) => Effect.Effect<Signature>
  readonly signTypedData: (typedData: TypedData) => Effect.Effect<Signature>
  readonly sign: (params: { hash: Hex }) => Effect.Effect<Signature>  // NEW
}

// Memory cleanup via Effect.acquireRelease
const LocalAccount = (privateKey: Hex) => 
  Effect.acquireRelease(
    Effect.sync(() => createAccount(privateKey)),
    (account) => Effect.sync(() => account.clearKey())
  )
```
</effect_solution>
<implementation_steps>
1. Add `sign({ hash })` to AccountService interface
2. Add `publicKey` property to LocalAccount
3. Add HD derivation support to fromMnemonic
4. Create toAccount factory for custom signers
5. Implement ERC-6492 signature wrapping
6. Add memory cleanup for private keys (acquireRelease)
</implementation_steps>
</category>

<category name="Signature Utilities">
<priority>P1</priority>
<gaps>
- No `verifyMessage` / `verifyTypedData` / `verifyHash`
- No `recoverAddress` / `recoverMessageAddress`
- No `hashMessage` / `hashTypedData` exports
- Non-constant-time signature verification (security)
</gaps>
<viem_ref>
- `src/utils/signature/*.ts` - Signature utilities
- `src/utils/hash/*.ts` - Hash utilities
</viem_ref>
<effect_solution>
```typescript
// Signature verification
export const verifyMessage = (params: {
  message: string | Hex
  signature: Signature
  address: Address
}): Effect.Effect<boolean, VerifyError> => ...

export const recoverAddress = (params: {
  hash: Hex
  signature: Signature
}): Effect.Effect<Address, RecoverError> => ...

// Constant-time comparison
const constantTimeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  let result = 0
  for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i]
  return result === 0
}
```
</effect_solution>
<implementation_steps>
1. Export hashMessage, hashTypedData utilities
2. Implement verifyMessage, verifyTypedData, verifyHash
3. Implement recoverAddress, recoverMessageAddress
4. Add constant-time comparison utilities
5. Fix timing side-channels in Secp256k1 verify
</implementation_steps>
</category>

<category name="Nonce Management">
<priority>P0</priority>
<gaps>
- Race condition: plain Map causes duplicate nonces (review 080)
- No chainId in nonce key (multi-chain collision)
- No atomic increment operation
</gaps>
<viem_ref>
- `src/accounts/utils/nonceManager.ts`
</viem_ref>
<effect_solution>
```typescript
// Use SynchronizedRef for atomic operations
const deltaMapRef = yield* SynchronizedRef.make(
  HashMap.empty<`${Address}:${ChainId}`, number>()
)

// Atomic consume operation
readonly consume: (address: Address, chainId: number) => 
  Effect.gen(function* () {
    const key = `${address}:${chainId}` as const
    const provider = yield* ProviderService
    
    return yield* SynchronizedRef.modifyEffect(deltaMapRef, (map) =>
      Effect.gen(function* () {
        const delta = HashMap.get(map, key).pipe(Option.getOrElse(() => 0))
        const onChainNonce = yield* provider.getTransactionCount(address, "pending")
        const nonce = onChainNonce + delta
        const newMap = HashMap.set(map, key, delta + 1)
        return [nonce, newMap]
      })
    )
  })
```
</effect_solution>
<implementation_steps>
1. Replace Map with SynchronizedRef<HashMap>
2. Add chainId to nonce key
3. Use SynchronizedRef.modifyEffect for atomic operations
4. Add concurrency tests
</implementation_steps>
</category>

<category name="Unit Utilities">
<priority>P2</priority>
<gaps>
- No `parseEther` / `formatEther`
- No `parseUnits` / `formatUnits`
- No `parseGwei` / `formatGwei`
</gaps>
<viem_ref>
- `src/utils/unit/*.ts`
</viem_ref>
<effect_solution>
```typescript
// Pure functions (no Effect wrapper needed)
export const parseEther = (value: string): bigint =>
  parseUnits(value, 18)

export const formatEther = (value: bigint): string =>
  formatUnits(value, 18)

export const parseUnits = (value: string, decimals: number): bigint => ...
export const formatUnits = (value: bigint, decimals: number): string => ...
```
</effect_solution>
<implementation_steps>
1. Implement parseUnits/formatUnits
2. Add parseEther/formatEther (18 decimals)
3. Add parseGwei/formatGwei (9 decimals)
4. Add to exports
</implementation_steps>
</category>

<category name="Blob/KZG Utilities">
<priority>P3</priority>
<gaps>
- No blob transaction helpers
- No `getBlobBaseFee`
- KZG uses Effect.sync for throwing operations (review 087)
</gaps>
<viem_ref>
- `src/utils/blob/*.ts`
- `src/actions/public/getBlobBaseFee.ts`
</viem_ref>
<effect_solution>
```typescript
// Fix KZG to use Effect.try
readonly computeProof: (blob: Blob, z: Bytes32) =>
  Effect.try({
    try: () => kzg.computeProof(blob, z),
    catch: (e) => new KzgError({ message: String(e), cause: e })
  })

// Add getBlobBaseFee
readonly getBlobBaseFee: () => Effect.Effect<bigint, RpcError>
```
</effect_solution>
<implementation_steps>
1. Fix KZG Effect.sync → Effect.try
2. Add getBlobBaseFee to Provider
3. Add blob transaction helpers
</implementation_steps>
</category>

<category name="SIWE and Auth">
<priority>P3</priority>
<gaps>
- No Sign-In with Ethereum (SIWE) support
- No message parsing/verification
</gaps>
<viem_ref>
- `src/siwe/*.ts`
</viem_ref>
<effect_solution>
```typescript
// SIWE message creation and verification
export const createSiweMessage = (params: SiweParams): string => ...
export const parseSiweMessage = (message: string): Effect.Effect<SiweMessage, ParseError> => ...
export const verifySiweMessage = (params: VerifyParams): Effect.Effect<boolean, VerifyError> => ...
```
</effect_solution>
<implementation_steps>
1. Implement createSiweMessage
2. Implement parseSiweMessage with Schema validation
3. Implement verifySiweMessage
</implementation_steps>
</category>

</gap_categories>

<implementation_roadmap>

<phase number="1" priority="P0" name="Critical Runtime Fixes">
<timeline>Week 1</timeline>
<goals>Fix bugs that cause incorrect behavior in production</goals>
<steps>
1. NonceManager race condition → SynchronizedRef (review 034, 074, 080)
2. FallbackTransport mutable array → Ref (review 033, 043, 075)
3. WebSocketTransport Effect.runSync → Runtime.runFork (review 040, 073)
4. HttpTransport manual retry → Effect.retry + Schedule (review 017)
5. HttpTransport mutable requestId → Ref (review 018)
</steps>
<files>
- src/services/NonceManager/DefaultNonceManager.ts
- src/services/Transport/FallbackTransport.ts
- src/services/Transport/WebSocketTransport.ts
- src/services/Transport/HttpTransport.ts
</files>
</phase>

<phase number="2" priority="P0" name="Transport Enhancements">
<timeline>Week 1-2</timeline>
<goals>Production-ready transport layer</goals>
<steps>
1. Add fetchOptions to HttpTransport
2. Add request/response interceptor FiberRefs
3. Implement request deduplication
4. Implement JSON-RPC batching via Effect.request
5. Add IpcTransport for local nodes
</steps>
<files>
- src/services/Transport/HttpTransport.ts
- src/services/Transport/BatchScheduler.ts (NEW)
- src/services/Transport/IpcTransport.ts (NEW)
</files>
</phase>

<phase number="3" priority="P0" name="Provider Simulation">
<timeline>Week 2</timeline>
<goals>Accurate transaction simulation</goals>
<steps>
1. Add stateOverride to call/estimateGas
2. Add blockOverrides support
3. Implement simulateContract
4. Add getBlobBaseFee
</steps>
<files>
- src/services/Provider/Provider.ts
- src/services/Provider/types.ts
</files>
</phase>

<phase number="4" priority="P1" name="Chain Configuration">
<timeline>Week 2-3</timeline>
<goals>L2 chain support</goals>
<steps>
1. Create ChainFormatterService
2. Create ChainSerializerService
3. Create ChainFeesService
4. Implement OP Stack layers
5. Implement Arbitrum layers
6. Implement Celo layers
</steps>
<files>
- src/services/Chain/ChainFormatterService.ts (NEW)
- src/services/Chain/ChainSerializerService.ts (NEW)
- src/services/Chain/ChainFeesService.ts (NEW)
- src/services/Chain/chains/optimism.ts (NEW)
- src/services/Chain/chains/arbitrum.ts (NEW)
</files>
</phase>

<phase number="5" priority="P1" name="Signature & Auth">
<timeline>Week 3</timeline>
<goals>Signature verification and EIP-7702</goals>
<steps>
1. Export hashMessage, hashTypedData
2. Implement verifyMessage, verifyTypedData
3. Implement recoverAddress
4. Add constant-time comparison utilities
5. Implement signAuthorization (EIP-7702)
</steps>
<files>
- src/crypto/Signature/verify.ts (NEW)
- src/crypto/Signature/recover.ts (NEW)
- src/primitives/Hash/message.ts (NEW)
- src/services/Signer/signAuthorization.ts (NEW)
</files>
</phase>

<phase number="6" priority="P1" name="Account Enhancements">
<timeline>Week 3-4</timeline>
<goals>Complete account system</goals>
<steps>
1. Add sign({ hash }) to Account
2. Add publicKey property
3. Add memory cleanup for private keys
4. Add HD derivation options
5. Implement toAccount factory
</steps>
<files>
- src/services/Account/AccountService.ts
- src/services/Account/LocalAccount.ts
- src/services/Account/fromMnemonic.ts
</files>
</phase>

<phase number="7" priority="P1" name="Wallet Actions">
<timeline>Week 4</timeline>
<goals>Full wallet management</goals>
<steps>
1. Add addChain (EIP-3085)
2. Add switchChain
3. Add watchAsset (EIP-747)
4. Add getPermissions/requestPermissions
5. Add deployContract helper
</steps>
<files>
- src/services/Signer/actions/addChain.ts (NEW)
- src/services/Signer/actions/switchChain.ts (NEW)
- src/services/Signer/actions/watchAsset.ts (NEW)
- src/services/Signer/actions/deployContract.ts (NEW)
</files>
</phase>

<phase number="8" priority="P1" name="Contract & Multicall">
<timeline>Week 4-5</timeline>
<goals>Contract interaction helpers</goals>
<steps>
1. Implement MulticallService
2. Add Contract.estimateGas
3. Add Contract.simulate
4. Improve Contract types (ABI tuple safety)
</steps>
<files>
- src/services/Multicall/MulticallService.ts (NEW)
- src/services/Multicall/DefaultMulticall.ts (NEW)
- src/services/Contract/Contract.ts
</files>
</phase>

<phase number="9" priority="P2" name="Subscriptions & Events">
<timeline>Week 5-6</timeline>
<goals>Event streaming support</goals>
<steps>
1. Implement watchEvent via Stream
2. Implement watchContractEvent
3. Add filter-based subscriptions (eth_newFilter)
4. Add watchPendingTransactions
</steps>
<files>
- src/services/Provider/watchEvent.ts (NEW)
- src/services/Provider/filters.ts (NEW)
- src/services/Contract/watchContractEvent.ts (NEW)
</files>
</phase>

<phase number="10" priority="P2" name="ENS & Utilities">
<timeline>Week 6</timeline>
<goals>ENS and unit utilities</goals>
<steps>
1. Implement ENS resolution methods
2. Add parseEther/formatEther
3. Add parseUnits/formatUnits
4. Add parseGwei/formatGwei
</steps>
<files>
- src/services/Provider/ens.ts (NEW)
- src/primitives/Unit/index.ts (NEW)
</files>
</phase>

<phase number="11" priority="P3" name="Advanced Features">
<timeline>Week 7+</timeline>
<goals>Complete feature parity</goals>
<steps>
1. SIWE support
2. ERC-6492 signatures
3. Blob transaction helpers
4. Fix remaining KZG/Bn254 issues
</steps>
</phase>

</implementation_roadmap>

<cross_references>
<reviews>
- [078-viem-walletclient-analysis.md](../reviews/078-viem-walletclient-analysis.md)
- [079-viem-account-analysis.md](../reviews/079-viem-account-analysis.md)
- [080-provider-signer-gaps.md](../reviews/080-provider-signer-gaps.md)
- [081-transport-configuration-gaps.md](../reviews/081-transport-configuration-gaps.md)
- [082-chain-configuration-gaps.md](../reviews/082-chain-configuration-gaps.md)
- [083-nonce-manager-gaps.md](../reviews/083-nonce-manager-gaps.md)
- [086-simulation-and-debugging-gaps.md](../reviews/086-simulation-and-debugging-gaps.md)
- [087-signature-utilities-gaps.md](../reviews/087-signature-utilities-gaps.md)
- [VIEM-COMPARISON-SUMMARY.md](../reviews/VIEM-COMPARISON-SUMMARY.md)
</reviews>
<design_docs>
- [SERVICES-DESIGN.md](../SERVICES-DESIGN.md)
- [IMPLEMENTATION-PLAN.md](../IMPLEMENTATION-PLAN.md)
</design_docs>
</cross_references>

</issue>
