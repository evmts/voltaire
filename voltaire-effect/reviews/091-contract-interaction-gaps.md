# Contract Interaction Gaps

<issue>
<metadata>
priority: P1
category: viem-parity
files: [src/services/Contract/]
reviews: []
</metadata>

<gap_analysis>
Comparing viem's contract interaction patterns with voltaire-effect's Contract factory.

<status_matrix>
| Feature | Viem | Voltaire | Priority |
|---------|------|----------|----------|
| contract.read.method() | ✅ | ✅ | - |
| contract.write.method() | ✅ | ✅ | - |
| contract.simulate.method() | ✅ Returns {request, result} | ⚠️ Result only | P1 |
| contract.estimateGas.method() | ✅ | ❌ | P1 |
| Read with blockTag | ✅ | ❌ | P1 |
| Read with account (msg.sender) | ✅ | ❌ | P1 |
| Read with stateOverride | ✅ | ❌ | P0 |
| getEvents with indexed arg filter | ✅ | ❌ | P1 |
| watchContractEvent | ✅ | ❌ | P1 |
| deployContract | ✅ | ❌ | P1 |
| Auto-multicall batching | ✅ | ❌ | P1 |
| multicall with contracts array | ✅ | ⚠️ Manual | P1 |
</status_matrix>
</gap_analysis>

<viem_reference>
<feature>simulateContract Returns Request</feature>
<location>viem/src/actions/public/simulateContract.ts</location>
<implementation>
```typescript
const { request, result } = await client.simulateContract({
  abi, address, functionName, args, account
})

// Pass request directly to writeContract
const hash = await client.writeContract(request)
```
</implementation>
</viem_reference>

<viem_reference>
<feature>estimateContractGas</feature>
<location>viem/src/actions/public/estimateContractGas.ts</location>
<implementation>
```typescript
const gas = await client.estimateContractGas({
  abi, address, functionName, args, account
})
```
</implementation>
</viem_reference>

<viem_reference>
<feature>Read with Options</feature>
<location>viem/src/actions/public/readContract.ts</location>
<implementation>
```typescript
// With block tag
const result = await client.readContract({
  abi, address, functionName, args,
  blockNumber: 12345n,
  // or blockTag: 'safe'
})

// With account context (sets msg.sender)
const result = await client.readContract({
  abi, address, functionName, args,
  account: '0x...'
})

// With state override
const result = await client.readContract({
  abi, address, functionName, args,
  stateOverride: [{
    address: '0x...',
    balance: parseEther('100')
  }]
})
```
</implementation>
</viem_reference>

<viem_reference>
<feature>Event Filtering and Watching</feature>
<location>viem/src/actions/public/getContractEvents.ts</location>
<implementation>
```typescript
// Get events with indexed arg filter
const events = await client.getContractEvents({
  abi,
  address: '0x...',
  eventName: 'Transfer',
  args: {
    from: '0x...',  // Type-safe filter by indexed param
    to: '0x...'
  },
  fromBlock: 12345n,
  toBlock: 'latest'
})

// Watch contract events
const unwatch = client.watchContractEvent({
  abi,
  address: '0x...',
  eventName: 'Transfer',
  onLogs: (logs) => console.log(logs)
})
```
</implementation>
</viem_reference>

<viem_reference>
<feature>deployContract</feature>
<location>viem/src/actions/wallet/deployContract.ts</location>
<implementation>
```typescript
const hash = await client.deployContract({
  abi,
  bytecode: '0x...',
  args: [constructorArg1, constructorArg2],
  account: '0x...'
})
```
</implementation>
</viem_reference>

<viem_reference>
<feature>multicall with Contracts</feature>
<location>viem/src/actions/public/multicall.ts</location>
<implementation>
```typescript
const results = await client.multicall({
  contracts: [
    { abi: erc20Abi, address: token1, functionName: 'balanceOf', args: [user] },
    { abi: erc20Abi, address: token2, functionName: 'balanceOf', args: [user] },
    { abi: erc20Abi, address: token3, functionName: 'balanceOf', args: [user] }
  ],
  allowFailure: true
})
```
</implementation>
</viem_reference>

<effect_solution>
```typescript
// Extended Contract read options
interface ReadOptions {
  readonly blockTag?: BlockTag
  readonly blockNumber?: bigint
  readonly account?: Address
  readonly stateOverride?: readonly StateOverride[]
}

// Extended simulate return type
interface SimulateResult<T> {
  readonly result: T
  readonly request: WriteRequest
  readonly gasUsed?: bigint
  readonly logs?: readonly Log[]
}

// Contract factory with extended methods
const Contract = <TAbi extends Abi>(
  address: Address,
  abi: TAbi
): Effect<ContractInstance<TAbi>, ProviderError, ProviderService> =>
  Effect.gen(function* () {
    const provider = yield* ProviderService
    
    // Read proxy with options support
    const read = new Proxy({} as any, {
      get: (_, functionName: string) => 
        (...args: any[]) => {
          const options = typeof args[args.length - 1] === 'object' 
            && !Array.isArray(args[args.length - 1])
            && !('length' in args[args.length - 1])
            ? args.pop() as ReadOptions
            : {}
          
          return provider.call({
            to: address,
            data: encodeFunctionData({ abi, functionName, args }),
            from: options.account,
            blockTag: options.blockTag,
            blockNumber: options.blockNumber,
            stateOverride: options.stateOverride
          }).pipe(
            Effect.map(data => decodeFunctionResult({ abi, functionName, data }))
          )
        }
    })
    
    // Simulate returns both result and request
    const simulate = new Proxy({} as any, {
      get: (_, functionName: string) =>
        (...args: any[]): Effect<SimulateResult<any>, ProviderError, ProviderService> =>
          Effect.gen(function* () {
            const options = extractOptions(args)
            const callData = encodeFunctionData({ abi, functionName, args })
            
            const { data, gasUsed, logs } = yield* provider.simulateCall({
              to: address,
              data: callData,
              from: options.account,
              value: options.value,
              stateOverride: options.stateOverride
            })
            
            const result = decodeFunctionResult({ abi, functionName, data })
            
            const request: WriteRequest = {
              to: address,
              data: callData,
              value: options.value,
              gas: options.gas ?? gasUsed
            }
            
            return { result, request, gasUsed, logs }
          })
    })
    
    // Estimate gas proxy
    const estimateGas = new Proxy({} as any, {
      get: (_, functionName: string) =>
        (...args: any[]): Effect<bigint, ProviderError> =>
          Effect.gen(function* () {
            const options = extractOptions(args)
            return yield* provider.estimateGas({
              to: address,
              data: encodeFunctionData({ abi, functionName, args }),
              from: options.account,
              value: options.value
            })
          })
    })
    
    // Event watching as Stream
    const watchEvent = <TEventName extends string>(
      eventName: TEventName,
      options?: {
        args?: Record<string, unknown>  // Indexed arg filters
        pollingInterval?: number
        fromBlock?: bigint
      }
    ): Stream<DecodedEvent<TAbi, TEventName>, ProviderError> =>
      provider.watchLogs({
        address,
        topics: encodeEventTopics({ abi, eventName, args: options?.args }),
        pollingInterval: options?.pollingInterval ?? 1000
      }).pipe(
        Stream.map(log => decodeEventLog({ abi, log }))
      )
    
    // Get events with indexed arg filtering
    const getEvents = <TEventName extends string>(
      eventName: TEventName,
      options?: {
        args?: Record<string, unknown>
        fromBlock?: bigint
        toBlock?: bigint | BlockTag
      }
    ): Effect<readonly DecodedEvent<TAbi, TEventName>[], ProviderError> =>
      provider.getLogs({
        address,
        topics: encodeEventTopics({ abi, eventName, args: options?.args }),
        fromBlock: options?.fromBlock,
        toBlock: options?.toBlock
      }).pipe(
        Effect.map(logs => logs.map(log => decodeEventLog({ abi, log })))
      )
    
    return { read, write, simulate, estimateGas, getEvents, watchEvent }
  })

// Deploy contract helper
const deployContract = <TAbi extends Abi>(params: {
  abi: TAbi
  bytecode: Hex
  args?: readonly unknown[]
}): Effect<{ hash: Hash; address: Address }, SignerError, SignerService> =>
  Effect.gen(function* () {
    const signer = yield* SignerService
    
    const deployData = params.args
      ? Hex.concat([params.bytecode, encodeConstructorArgs(params.abi, params.args)])
      : params.bytecode
    
    const hash = yield* signer.sendTransaction({
      data: deployData
      // to is undefined for contract creation
    })
    
    // Wait for receipt to get deployed address
    const receipt = yield* waitForTransactionReceipt(hash)
    
    if (!receipt.contractAddress) {
      return yield* Effect.fail(new ContractDeployError({ 
        message: 'Contract deployment failed',
        hash
      }))
    }
    
    return { hash, address: receipt.contractAddress }
  })

// Convenience multicall for typed contracts
const multicallContracts = <T extends readonly ContractCall[]>(
  calls: T,
  options?: { allowFailure?: boolean }
): Effect<MulticallResults<T>, ProviderError, MulticallService> =>
  Effect.gen(function* () {
    const multicall = yield* MulticallService
    
    const encodedCalls = calls.map(call => ({
      target: call.address,
      callData: encodeFunctionData({
        abi: call.abi,
        functionName: call.functionName,
        args: call.args
      }),
      allowFailure: options?.allowFailure ?? false
    }))
    
    const results = yield* multicall.aggregate3(encodedCalls)
    
    return results.map((r, i) => {
      if (!r.success) return { status: 'failure', error: r.returnData }
      return {
        status: 'success',
        result: decodeFunctionResult({
          abi: calls[i].abi,
          functionName: calls[i].functionName,
          data: r.returnData
        })
      }
    }) as MulticallResults<T>
  })
```
</effect_solution>

<implementation>
<new_files>
- src/services/Contract/estimateGas.ts
- src/services/Contract/watchEvent.ts
- src/services/Contract/deployContract.ts
- src/services/Contract/multicallContracts.ts
</new_files>

<phases>
1. **Phase 1 - estimateGas** (P1)
   - Add `contract.estimateGas.method()` proxy
   - Return bigint gas estimate

2. **Phase 2 - Read Options** (P1)
   - Add blockTag/blockNumber support
   - Add account parameter for msg.sender
   - Add stateOverride support

3. **Phase 3 - Simulate Request** (P1)
   - Return `{ result, request }` from simulate
   - Include gasUsed and logs
   - Enable simulate → write chaining

4. **Phase 4 - Event Improvements** (P1)
   - Add indexed arg filtering to getEvents
   - Add watchEvent stream method

5. **Phase 5 - deployContract** (P1)
   - Helper for contract deployment
   - Returns hash and deployed address

6. **Phase 6 - multicallContracts** (P1)
   - Typed multicall with contract array
   - allowFailure option
</phases>
</implementation>

<tests>
```typescript
describe('Contract', () => {
  describe('estimateGas', () => {
    it('estimates gas for method call', () =>
      Effect.gen(function* () {
        const contract = yield* Contract(tokenAddress, erc20Abi)
        const gas = yield* contract.estimateGas.transfer(recipient, 100n)
        
        expect(gas).toBeTypeOf('bigint')
        expect(gas).toBeGreaterThan(21000n)
      }))
  })
  
  describe('read with options', () => {
    it('reads at specific block', () =>
      Effect.gen(function* () {
        const contract = yield* Contract(tokenAddress, erc20Abi)
        const balance = yield* contract.read.balanceOf(user, { blockNumber: 12345n })
        expect(balance).toBeTypeOf('bigint')
      }))
    
    it('reads with state override', () =>
      Effect.gen(function* () {
        const contract = yield* Contract(tokenAddress, erc20Abi)
        const balance = yield* contract.read.balanceOf(user, {
          stateOverride: [{
            address: tokenAddress,
            stateDiff: [{ slot: balanceSlot, value: '0x' + 'ff'.repeat(32) }]
          }]
        })
        expect(balance).toBeGreaterThan(0n)
      }))
  })
  
  describe('simulate', () => {
    it('returns result and request', () =>
      Effect.gen(function* () {
        const contract = yield* Contract(tokenAddress, erc20Abi)
        const { result, request, gasUsed } = yield* contract.simulate.transfer(recipient, 100n)
        
        expect(result).toBe(true)
        expect(request.to).toBe(tokenAddress)
        expect(gasUsed).toBeTypeOf('bigint')
      }))
  })
  
  describe('watchEvent', () => {
    it('streams events', () =>
      Effect.gen(function* () {
        const contract = yield* Contract(tokenAddress, erc20Abi)
        const events$ = contract.watchEvent('Transfer', { 
          args: { from: sender } 
        })
        
        const events = yield* Stream.take(events$, 1).pipe(Stream.runCollect)
        expect(Chunk.toReadonlyArray(events)).toHaveLength(1)
      }))
  })
  
  describe('deployContract', () => {
    it('deploys and returns address', () =>
      Effect.gen(function* () {
        const { hash, address } = yield* deployContract({
          abi: testContractAbi,
          bytecode: testContractBytecode,
          args: [42n]
        })
        
        expect(hash).toMatch(/^0x[0-9a-f]{64}$/)
        expect(address).toMatch(/^0x[0-9a-f]{40}$/)
      }))
  })
})
```
</tests>

<references>
- https://viem.sh/docs/contract/simulateContract
- https://viem.sh/docs/contract/estimateContractGas
- https://viem.sh/docs/contract/readContract
- https://viem.sh/docs/contract/watchContractEvent
- https://viem.sh/docs/contract/deployContract
- https://viem.sh/docs/actions/public/multicall
</references>
</issue>
