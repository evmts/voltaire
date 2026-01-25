# Simulation and Debugging Gaps

<issue>
<metadata>
priority: P0
category: viem-parity
files: [src/services/Provider/, src/services/Contract/]
reviews: []
</metadata>

<gap_analysis>
Viem has advanced simulation capabilities critical for dApp UX. Voltaire-effect lacks most of these features.

<status_matrix>
| Feature | Viem | Voltaire | Priority |
|---------|------|----------|----------|
| simulateBlocks (eth_simulateV1) | ✅ Full | ❌ | P1 |
| simulateCalls | ✅ Full | ❌ | P0 |
| simulateContract | ✅ Full | ⚠️ Partial | P1 |
| stateOverride in call | ✅ | ❌ | P0 |
| blockOverrides in call | ✅ | ❌ | P1 |
| Deployless calls (code param) | ✅ | ❌ | P1 |
| Asset change tracking | ✅ | ❌ | P0 |
| getTransactionConfirmations | ✅ | ❌ | P2 |
| estimateContractGas | ✅ | ❌ | P2 |
| Auto-multicall batching | ✅ | ❌ | P1 |
</status_matrix>
</gap_analysis>

<viem_reference>
<feature>simulateBlocks (eth_simulateV1)</feature>
<location>viem/src/actions/public/simulateBlocks.ts</location>
<implementation>
```typescript
const result = await client.simulateBlocks({
  blocks: [{
    blockOverrides: { number: 69420n },
    calls: [
      { to: '0x...', data: '0x...', value: 1n },
      { to: '0x...', data: '0x...' }
    ],
    stateOverrides: [{
      address: '0x...',
      balance: parseEther('10')
    }]
  }],
  returnFullTransactions: true,
  traceTransfers: true,
  validation: true
})
```
</implementation>
</viem_reference>

<viem_reference>
<feature>simulateCalls with Asset Change Tracking</feature>
<location>viem/src/actions/public/simulateCalls.ts</location>
<implementation>
```typescript
const { assetChanges, block, results } = await client.simulateCalls({
  account: '0x...',
  calls: [
    { to: '0x...', data: '0x...' },
    { to: '0x...', value: 1n }
  ],
  traceAssetChanges: true
})

// assetChanges shows token balance diffs:
// [{ token: { address, symbol, decimals }, value: { pre, post, diff } }]
```
</implementation>
</viem_reference>

<viem_reference>
<feature>State and Block Overrides in call</feature>
<location>viem/src/actions/public/call.ts</location>
<implementation>
```typescript
await client.call({
  to: '0x...',
  data: '0x...',
  
  // Block overrides
  blockOverrides: {
    number: 12345n,
    time: 1716846083n,
    gasLimit: 30_000_000n,
    feeRecipient: '0x...',
    baseFeePerGas: 1_000_000_000n
  },
  
  // State overrides
  stateOverride: [{
    address: '0x...',
    balance: parseEther('100'),
    nonce: 5,
    code: '0x...',
    stateDiff: [
      { slot: '0x0', value: '0x1234...' }
    ]
  }]
})
```
</implementation>
</viem_reference>

<viem_reference>
<feature>Deployless Calls</feature>
<location>viem/src/actions/public/call.ts</location>
<implementation>
```typescript
// Call arbitrary bytecode without deploying
await client.call({
  code: '0x608060...',  // Bytecode to execute
  data: '0x...'         // Calldata for the code
})

// Or via factory pattern for counterfactual accounts
await client.call({
  factory: '0x...',     // Factory address
  factoryData: '0x...', // Factory calldata
  to: '0x...',          // Target (will be deployed)
  data: '0x...'         // Calldata for target
})
```
</implementation>
</viem_reference>

<effect_solution>
```typescript
// State override types
interface StateOverride {
  readonly address: Address
  readonly balance?: bigint
  readonly nonce?: number
  readonly code?: Hex
  readonly state?: StateMapping
  readonly stateDiff?: StateMapping
}

type StateMapping = Array<{
  readonly slot: Hex
  readonly value: Hex
}>

// Block override types
interface BlockOverrides {
  readonly number?: bigint
  readonly time?: bigint
  readonly gasLimit?: bigint
  readonly feeRecipient?: Address
  readonly baseFeePerGas?: bigint
  readonly blobBaseFee?: bigint
}

// Extended call parameters
interface CallParams {
  readonly to?: Address
  readonly data?: Hex
  readonly value?: bigint
  readonly gas?: bigint
  readonly from?: Address
  
  // Overrides
  readonly stateOverride?: readonly StateOverride[]
  readonly blockOverrides?: BlockOverrides
  
  // Deployless call
  readonly code?: Hex
  readonly factory?: Address
  readonly factoryData?: Hex
}

// simulateCalls with Effect
interface SimulateCallsParams {
  readonly account?: Address
  readonly calls: readonly CallParams[]
  readonly blockTag?: BlockTag
  readonly stateOverride?: readonly StateOverride[]
  readonly traceAssetChanges?: boolean
}

interface AssetChange {
  readonly token: {
    readonly address: Address
    readonly symbol?: string
    readonly decimals?: number
  }
  readonly value: {
    readonly pre: bigint
    readonly post: bigint
    readonly diff: bigint
  }
}

interface SimulateCallsResult {
  readonly results: readonly {
    readonly data: Hex
    readonly gasUsed: bigint
    readonly logs: readonly Log[]
    readonly status: 'success' | 'reverted'
  }[]
  readonly assetChanges?: readonly AssetChange[]
}

const simulateCalls = (params: SimulateCallsParams): 
  Effect<SimulateCallsResult, ProviderError, ProviderService> =>
  Effect.gen(function* () {
    const provider = yield* ProviderService
    
    const result = yield* provider.request({
      method: 'eth_simulateV1',
      params: [{
        blocks: [{
          calls: params.calls.map(formatCall),
          stateOverrides: params.stateOverride?.map(formatStateOverride)
        }],
        traceTransfers: params.traceAssetChanges
      }, params.blockTag ?? 'latest']
    })
    
    return parseSimulateResult(result, params.traceAssetChanges)
  })

// Add stateOverride to Provider.call
interface ProviderShape {
  readonly call: (params: CallParams) => Effect<Hex, ProviderError>
  readonly simulateCalls: (params: SimulateCallsParams) => Effect<SimulateCallsResult, ProviderError>
  readonly simulateBlocks: (params: SimulateBlocksParams) => Effect<SimulateBlocksResult, ProviderError>
}
```
</effect_solution>

<implementation>
<new_files>
- src/services/Provider/call.ts (extend with overrides)
- src/services/Provider/simulateCalls.ts
- src/services/Provider/simulateBlocks.ts
- src/primitives/StateOverride/StateOverrideType.ts
- src/primitives/BlockOverrides/BlockOverridesType.ts
- src/services/Contract/estimateGas.ts
</new_files>

<phases>
1. **Phase 1 - stateOverride in call** (P0)
   - Add StateOverride and BlockOverrides types
   - Extend Provider.call to accept overrides
   - Essential for accurate simulations

2. **Phase 2 - simulateCalls** (P0)
   - Implement eth_simulateV1 RPC call
   - Add asset change tracking
   - Return per-call results with gas and logs

3. **Phase 3 - Deployless calls** (P1)
   - Add `code` parameter to call
   - Add `factory`/`factoryData` for counterfactual

4. **Phase 4 - simulateBlocks** (P1)
   - Full block simulation with sequences
   - Block overrides per simulated block

5. **Phase 5 - Contract convenience** (P2)
   - Add `contract.estimateGas.method()`
   - Return request from simulate for chaining

6. **Phase 6 - Auto-multicall** (P1)
   - Integrate multicall batching into Provider
   - Configurable batch size and wait time
</phases>
</implementation>

<tests>
```typescript
describe('stateOverride', () => {
  it('call respects balance override', () =>
    Effect.gen(function* () {
      const result = yield* Provider.call({
        to: contractAddress,
        data: encodeBalanceOf(zeroAddress),
        stateOverride: [{
          address: zeroAddress,
          balance: parseEther('1000')
        }]
      })
      expect(decodeBalance(result)).toBe(parseEther('1000'))
    }))
})

describe('simulateCalls', () => {
  it('simulates multiple calls with asset tracking', () =>
    Effect.gen(function* () {
      const { results, assetChanges } = yield* Provider.simulateCalls({
        account: userAddress,
        calls: [
          { to: tokenA, data: encodeTransfer(recipient, 100n) },
          { to: tokenB, data: encodeApprove(spender, MAX_UINT256) }
        ],
        traceAssetChanges: true
      })
      
      expect(results).toHaveLength(2)
      expect(results[0].status).toBe('success')
      expect(assetChanges).toBeDefined()
    }))
})

describe('deployless calls', () => {
  it('executes bytecode without deployment', () =>
    Effect.gen(function* () {
      const result = yield* Provider.call({
        code: testBytecode,
        data: encodeTestMethod()
      })
      expect(result).toMatch(/^0x/)
    }))
})
```
</tests>

<references>
- https://viem.sh/docs/actions/public/simulateBlocks
- https://viem.sh/docs/actions/public/call (stateOverride, blockOverrides)
- https://github.com/ethereum/execution-apis (eth_simulateV1)
- tevm-monorepo/packages/memory-client/src/test/viem/simulateContract.spec.ts
</references>
</issue>
