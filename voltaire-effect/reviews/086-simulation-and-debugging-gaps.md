# Simulation and Debugging Gaps

**Date**: 2026-01-25
**Priority**: High
**Category**: Missing Features

## Overview

viem has advanced simulation capabilities that voltaire-effect lacks. These are critical for dApp UX (showing users what will happen before they sign).

## Simulation Methods

### `simulateBlocks` (eth_simulateV1)

**viem**: Full implementation
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

**voltaire-effect**: Not implemented

**Features**:
- Simulate multiple blocks in sequence
- Block overrides (number, timestamp, gas limit, etc.)
- State overrides per block
- Per-call results with gas used and logs
- Return full transaction objects
- Trace asset transfers
- Validation mode

### `simulateCalls`

**viem**: Convenience wrapper around simulateBlocks
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

**voltaire-effect**: Not implemented

**Key Feature - Asset Change Tracking**:
- Automatically detects ERC20/721 contracts touched
- Fetches pre/post balances
- Returns human-readable asset changes
- Essential for "what will this do?" UX

### `simulateContract`

**viem**:
```typescript
const { request, result } = await client.simulateContract({
  abi,
  address: '0x...',
  functionName: 'mint',
  args: [1n],
  account: '0x...'
})

// Can pass request directly to writeContract if simulation succeeds
await client.writeContract(request)
```

**voltaire-effect**: Has `contract.simulate.methodName()` but:
- ❌ No account parameter
- ❌ No request object for follow-up write
- ❌ No gas used reporting
- ❌ No logs from simulation

### Block/State Overrides in `call`

**viem**:
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

**voltaire-effect**: Only basic call
- ❌ No `blockOverrides`
- ❌ No `stateOverride`

## State Override Types

### viem StateOverride

```typescript
type StateOverride = Array<{
  address: Address
  balance?: bigint       // Override ETH balance
  nonce?: number         // Override nonce
  code?: Hex            // Override contract code
  
  // Either state OR stateDiff, not both
  state?: StateMapping      // Replace entire storage
  stateDiff?: StateMapping  // Modify specific slots
}>

type StateMapping = Array<{
  slot: Hex   // bytes32 storage slot
  value: Hex  // bytes32 value
}>
```

### voltaire-effect

**Not implemented at all.**

## Deployless Calls

**viem**: Supports calling code that isn't deployed
```typescript
// Call arbitrary bytecode without deploying
await client.call({
  code: '0x608060...',  // Bytecode to execute
  data: '0x...'         // Calldata for the code
})

// Or via factory pattern
await client.call({
  factory: '0x...',     // Factory address
  factoryData: '0x...', // Factory calldata
  to: '0x...',          // Target (will be deployed)
  data: '0x...'         // Calldata for target
})
```

**voltaire-effect**: Not implemented

**Use cases**:
- Gas estimation for counterfactual accounts
- Testing contract logic before deployment
- Deployless multicall

## Debug/Trace Methods

### getTransactionConfirmations

**viem**:
```typescript
const confirmations = await client.getTransactionConfirmations({
  hash: '0x...'
})
// or
const confirmations = await client.getTransactionConfirmations({
  transactionReceipt: receipt
})
```

**voltaire-effect**: Not implemented (would need to calculate from current block)

### estimateContractGas

**viem**: Convenience for estimating contract call gas
```typescript
const gas = await client.estimateContractGas({
  abi,
  address: '0x...',
  functionName: 'transfer',
  args: ['0x...', 100n],
  account: '0x...'
})
```

**voltaire-effect**: Would need to:
1. Encode function data
2. Call `provider.estimateGas({ to, data, from })`

Not a convenience wrapper.

## Multicall Batching

### viem Auto-Batching

**viem**: Automatic multicall batching on `call`
```typescript
const client = createPublicClient({
  batch: {
    multicall: {
      batchSize: 1024,   // Max calldata size
      wait: 0,           // Wait before sending batch
      deployless: true   // Use deployless multicall
    }
  }
})

// These automatically batch:
const [a, b, c] = await Promise.all([
  client.call({ to, data: data1 }),
  client.call({ to, data: data2 }),
  client.call({ to, data: data3 })
])
```

**voltaire-effect**:
- Has `MulticallService.aggregate3()` but:
- ❌ Not automatic
- ❌ No deployless mode
- ❌ Not integrated with Provider.call()

## Recommendations

### Critical

1. **Add `stateOverride` to `call` and `estimateGas`**
   - Essential for accurate simulations
   - Used by every wallet/dApp

2. **Add `blockOverrides` to `call`**
   - Required for time-sensitive simulations

3. **Add `simulateCalls` with asset change tracking**
   - Essential for "preview" UX
   - Shows users token balance changes

### High Priority

4. **Add deployless call support**
   - `code` parameter for arbitrary bytecode
   - `factory`/`factoryData` for counterfactual

5. **Add `getTransactionConfirmations`**
   - Common UX need

6. **Add auto-multicall batching to Provider**
   - Significant performance improvement

### Medium Priority

7. **Add `simulateBlocks` (eth_simulateV1)**
   - Full block simulation
   - Advanced use cases

8. **Add `estimateContractGas` convenience**
   - Or make Contract.simulate return gas used

9. **Add deployless multicall mode**
   - Works on chains without multicall3 deployed
