# EIP Compliance Gaps

<issue>
<metadata>
priority: P1
category: viem-parity
files: [src/services/Provider/, src/services/Signer/, src/jsonrpc/]
reviews: [078-viem-walletclient-analysis, 082-chain-configuration-gaps, 104-blob-kzg-primitives-review]
</metadata>

<gap_analysis>
Viem provides comprehensive EIP compliance across wallet, transaction, RPC, ENS, and account abstraction domains. Voltaire-effect has significant gaps.

<status_matrix>
| EIP | Feature | Viem | Voltaire | Priority |
|-----|---------|------|----------|----------|
| EIP-191/712 | signMessage, signTypedData | ✅ | ✅ | - |
| EIP-2718/2930/1559 | Transaction types 0-2 | ✅ | ✅ | - |
| EIP-4844 | Blob transactions | ✅ Full | ⚠️ Partial | P0 |
| EIP-7702 | Authorization signing | ✅ | ⚠️ Partial | P0 |
| EIP-747 | wallet_watchAsset | ✅ | ❌ | P1 |
| EIP-2255 | wallet_requestPermissions | ✅ | ❌ | P1 |
| EIP-3085 | wallet_addEthereumChain | ✅ | ❌ | P1 |
| EIP-5792 | wallet_sendCalls | ✅ Full | ⚠️ Missing showCallsStatus | P1 |
| EIP-1474 | Filter methods | ✅ | ❌ | P1 |
| EIP-3668 | CCIP Read | ✅ Integrated | ⚠️ Service exists, not wired | P1 |
| EIP-137/181 | ENS | ✅ | ❌ | P2 |
| EIP-4337 | Account Abstraction | ✅ | ❌ | P3 |
| EIP-6492 | Counterfactual signatures | ✅ | ❌ | P2 |
</status_matrix>
</gap_analysis>

<viem_reference>
<feature>EIP-747 Wallet Watch Asset</feature>
<location>viem/src/actions/wallet/watchAsset.ts</location>
<implementation>
```typescript
export async function watchAsset(
  client: Client<Transport, Chain | undefined, Account>,
  params: WatchAssetParameters
): Promise<boolean> {
  return client.request({
    method: 'wallet_watchAsset',
    params: {
      type: params.type,
      options: {
        address: params.options.address,
        decimals: params.options.decimals,
        image: params.options.image,
        symbol: params.options.symbol,
        tokenId: params.options.tokenId,
      }
    }
  })
}
```
</implementation>
</viem_reference>

<viem_reference>
<feature>EIP-7702 Sign Authorization</feature>
<location>viem/src/actions/wallet/signAuthorization.ts</location>
<implementation>
```typescript
export async function signAuthorization(
  client: Client<Transport, Chain | undefined, Account>,
  parameters: SignAuthorizationParameters
): Promise<SignedAuthorization> {
  const { account, authorization } = parameters
  
  const signature = await account.signAuthorization({
    address: authorization.address,
    chainId: authorization.chainId,
    nonce: authorization.nonce
  })
  
  return { ...authorization, ...signature }
}
```
</implementation>
</viem_reference>

<viem_reference>
<feature>EIP-4844 Get Blob Base Fee</feature>
<location>viem/src/actions/public/getBlobBaseFee.ts</location>
<implementation>
```typescript
export async function getBlobBaseFee(
  client: Client<Transport, Chain | undefined>
): Promise<bigint> {
  const baseFee = await client.request({ method: 'eth_blobBaseFee' })
  return hexToBigInt(baseFee)
}
```
</implementation>
</viem_reference>

<viem_reference>
<feature>EIP-1474 Filter Methods</feature>
<location>viem/src/actions/public/createEventFilter.ts</location>
<implementation>
```typescript
export async function createEventFilter(client, params) {
  const filter = await client.request({
    method: 'eth_newFilter',
    params: [{ 
      address: params.address,
      topics: params.topics,
      fromBlock: params.fromBlock,
      toBlock: params.toBlock 
    }]
  })
  return { id: filter, type: 'event' }
}
```
</implementation>
</viem_reference>

<effect_solution>
```typescript
// WalletActionsService for EIP-747, EIP-2255, EIP-3085
interface WalletActionsShape {
  readonly watchAsset: (params: WatchAssetParams) => Effect<boolean, WalletError>
  readonly requestPermissions: (perms: RequestPermissionsParams) => Effect<WalletPermission[], WalletError>
  readonly getPermissions: () => Effect<WalletPermission[], WalletError>
  readonly addChain: (chain: AddChainParams) => Effect<void, WalletError>
  readonly showCallsStatus: (id: Hex) => Effect<void, WalletError>
}

class WalletActionsService extends Context.Tag('WalletActionsService')<
  WalletActionsService,
  WalletActionsShape
>() {}

// EIP-7702 authorization with Effect
interface Authorization {
  readonly address: Address
  readonly chainId: number
  readonly nonce: bigint
}

interface SignedAuthorization extends Authorization {
  readonly r: Hex
  readonly s: Hex
  readonly v: bigint
  readonly yParity: 0 | 1
}

const signAuthorization = (auth: Authorization): Effect<SignedAuthorization, SignerError, AccountService> =>
  Effect.gen(function* () {
    const account = yield* AccountService
    const message = hashAuthorization(auth)
    const signature = yield* account.signMessage({ raw: message })
    const { r, s, v } = parseSignature(signature)
    return { ...auth, r, s, v, yParity: v === 27n ? 0 : 1 }
  })

// EIP-1474 Filters with Effect resource management
const withEventFilter = (params: EventFilterParams) =>
  Effect.acquireRelease(
    provider.createEventFilter(params),
    (filterId) => provider.uninstallFilter(filterId).pipe(Effect.orDie)
  )

// EIP-4844 Blob fee
const getBlobBaseFee = (): Effect<bigint, ProviderError, ProviderService> =>
  Effect.gen(function* () {
    const provider = yield* ProviderService
    return yield* provider.request({ method: 'eth_blobBaseFee' }).pipe(
      Effect.map(hexToBigInt)
    )
  })
```
</effect_solution>

<implementation>
<new_files>
- src/services/WalletActions/WalletActionsService.ts
- src/services/WalletActions/watchAsset.ts
- src/services/WalletActions/requestPermissions.ts
- src/services/WalletActions/addChain.ts
- src/services/Provider/getBlobBaseFee.ts
- src/services/Provider/createFilter.ts
- src/services/Provider/getFilterChanges.ts
- src/services/Signer/signAuthorization.ts
- src/services/Ens/EnsService.ts
</new_files>

<phases>
1. **Phase 1 - EIP-7702 Completion** (P0)
   - Add `signAuthorization` to AccountService and Signer
   - Add `prepareAuthorization` with nonce lookup
   - Add `hashAuthorization` utility

2. **Phase 2 - EIP-4844 Completion** (P0)
   - Add `getBlobBaseFee` RPC method
   - Parse `blobGasUsed` and `blobGasPrice` from receipts

3. **Phase 3 - EIP-1474 Filters** (P1)
   - Add filter creation methods to Provider
   - Use Effect.acquireRelease for filter lifecycle

4. **Phase 4 - Wallet Actions** (P1)
   - Add WalletActionsService
   - Implement watchAsset, permissions, addChain

5. **Phase 5 - Wire CCIP** (P1)
   - Connect CcipService to Provider.call()

6. **Phase 6 - ENS** (P2)
   - Add EnsService with resolver lookups

7. **Phase 7 - EIP-4337** (P3)
   - Add SmartAccount type and bundler integration
</phases>
</implementation>

<tests>
```typescript
describe('EIP-7702 Authorization', () => {
  it('signAuthorization creates valid signed authorization', () =>
    Effect.gen(function* () {
      const auth = { address: '0x...', chainId: 1, nonce: 0n }
      const signed = yield* signAuthorization(auth)
      expect(signed.r).toMatch(/^0x[0-9a-f]{64}$/)
      expect(signed.yParity).toBeOneOf([0, 1])
    }).pipe(Effect.provide(testAccountLayer)))
})

describe('EIP-4844 Blob Fees', () => {
  it('getBlobBaseFee returns current blob base fee', () =>
    Effect.gen(function* () {
      const fee = yield* Provider.getBlobBaseFee()
      expect(fee).toBeTypeOf('bigint')
    }).pipe(Effect.provide(mainnetProviderLayer)))
})

describe('EIP-1474 Filters', () => {
  it('createEventFilter and getFilterChanges work together', () =>
    Effect.gen(function* () {
      const filterId = yield* Provider.createEventFilter({ address: '0x...' })
      const changes = yield* Provider.getFilterChanges(filterId)
      yield* Provider.uninstallFilter(filterId)
      expect(Array.isArray(changes)).toBe(true)
    }).pipe(Effect.provide(providerLayer)))
})
```
</tests>

<references>
- https://viem.sh/docs/actions/wallet/watchAsset
- https://viem.sh/docs/actions/wallet/signAuthorization
- https://viem.sh/docs/actions/public/getBlobBaseFee
- https://eips.ethereum.org/EIPS/eip-747
- https://eips.ethereum.org/EIPS/eip-7702
- https://eips.ethereum.org/EIPS/eip-4844
</references>
</issue>
