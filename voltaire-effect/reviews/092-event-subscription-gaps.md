# Event Subscription Gaps

<issue>
<metadata>
priority: P1
category: viem-parity
files: [src/services/Provider/, src/services/BlockStream/]
reviews: []
</metadata>

<gap_analysis>
Viem has multiple event watching mechanisms. Voltaire-effect only has watchBlocks.

<status_matrix>
| Feature | Viem | Voltaire | Priority |
|---------|------|----------|----------|
| watchBlocks | ✅ | ✅ Stream | - |
| watchBlockNumber | ✅ | ❌ | P2 |
| watchEvent | ✅ | ❌ | P0 |
| watchContractEvent | ✅ | ❌ | P0 |
| watchPendingTransactions | ✅ | ❌ | P2 |
| createBlockFilter | ✅ | ❌ | P1 |
| createEventFilter | ✅ | ❌ | P1 |
| createPendingTransactionFilter | ✅ | ❌ | P2 |
| getFilterChanges | ✅ | ❌ | P1 |
| getFilterLogs | ✅ | ❌ | P1 |
| uninstallFilter | ✅ | ❌ | P1 |
| WebSocket eth_subscribe | ✅ Auto | ⚠️ Verify | P1 |
</status_matrix>
</gap_analysis>

<viem_reference>
<feature>watchEvent</feature>
<location>viem/src/actions/public/watchEvent.ts</location>
<implementation>
```typescript
const unwatch = client.watchEvent({
  address: '0x...',
  event: parseAbiItem('event Transfer(address indexed, address indexed, uint256)'),
  args: {
    from: '0x...'  // Filter by indexed param
  },
  onLogs: (logs) => console.log(logs),
  onError: (error) => console.error(error),
  
  // Options
  batch: true,           // Batch logs
  pollingInterval: 1000, // Poll interval
  strict: true          // Type-strict arg matching
})
```
</implementation>
</viem_reference>

<viem_reference>
<feature>watchContractEvent</feature>
<location>viem/src/actions/public/watchContractEvent.ts</location>
<implementation>
```typescript
const unwatch = client.watchContractEvent({
  abi: erc20Abi,
  address: '0x...',
  eventName: 'Transfer',
  args: {
    from: sender,
    to: recipient
  },
  onLogs: (logs) => {
    // logs are typed based on ABI
    logs[0].args.value  // bigint
  }
})
```
</implementation>
</viem_reference>

<viem_reference>
<feature>watchPendingTransactions</feature>
<location>viem/src/actions/public/watchPendingTransactions.ts</location>
<implementation>
```typescript
const unwatch = client.watchPendingTransactions({
  onTransactions: (hashes) => console.log(hashes),
  batch: true,
  pollingInterval: 1000
})
```
</implementation>
</viem_reference>

<viem_reference>
<feature>Filter-based Subscriptions</feature>
<location>viem/src/actions/public/createEventFilter.ts</location>
<implementation>
```typescript
// Create filters
const blockFilter = await client.createBlockFilter()
const eventFilter = await client.createEventFilter({
  address: '0x...',
  event: parseAbiItem('event Transfer(...)'),
  fromBlock: 12345n
})
const pendingFilter = await client.createPendingTransactionFilter()

// Poll for changes
const changes = await client.getFilterChanges({ filter: blockFilter })

// Get all logs matching filter (for event filters)
const logs = await client.getFilterLogs({ filter: eventFilter })

// Remove filter
await client.uninstallFilter({ filter: blockFilter })
```
</implementation>
</viem_reference>

<viem_reference>
<feature>tevm-monorepo Event Filter Test</feature>
<location>tevm-monorepo/packages/memory-client/src/test/viem/createEventFilter.spec.ts</location>
<implementation>
```typescript
describe('createEventFilter', () => {
  it('creates filter', async () => {
    const filter = await mc.createEventFilter()
    expect(filter.id).toBeDefined()
  })
  
  it('with event ABI', async () => {
    const filter = await mc.createEventFilter(eventAbi)
    expect(filter.type).toBe('event')
  })
})

describe('watchContractEvent', () => {
  it('watches events', async () => {
    const logs = []
    const unwatch = mc.watchContractEvent({
      abi: c.simpleContract.abi,
      address: c.simpleContract.address,
      eventName: 'ValueSet',
      onLogs: (l) => logs.push(...l)
    })
    
    await mc.writeContract(c.simpleContract.write.set(42n))
    await sleep(100)
    
    expect(logs).toHaveLength(1)
    unwatch()
  })
})
```
</implementation>
</viem_reference>

<effect_solution>
```typescript
// Filter types
type FilterId = Hex & { readonly __tag: 'FilterId' }

interface EventFilter {
  readonly id: FilterId
  readonly type: 'event'
  readonly address?: Address
  readonly topics?: readonly (Hex | readonly Hex[] | null)[]
  readonly fromBlock?: bigint
  readonly toBlock?: bigint
}

interface BlockFilter {
  readonly id: FilterId
  readonly type: 'block'
}

interface PendingTransactionFilter {
  readonly id: FilterId
  readonly type: 'pending'
}

type Filter = EventFilter | BlockFilter | PendingTransactionFilter

// Provider extensions for filters
interface ProviderFilterShape {
  readonly createEventFilter: (params?: {
    address?: Address
    topics?: readonly (Hex | readonly Hex[] | null)[]
    fromBlock?: bigint
    toBlock?: bigint
  }) => Effect<EventFilter, ProviderError>
  
  readonly createBlockFilter: () => Effect<BlockFilter, ProviderError>
  
  readonly createPendingTransactionFilter: () => Effect<PendingTransactionFilter, ProviderError>
  
  readonly getFilterChanges: <T extends Filter>(filter: T) => 
    Effect<FilterChanges<T>, ProviderError>
  
  readonly getFilterLogs: (filter: EventFilter) => Effect<readonly Log[], ProviderError>
  
  readonly uninstallFilter: (filter: Filter) => Effect<boolean, ProviderError>
}

// Filter resource management with Effect
const withEventFilter = <A, E>(
  params: EventFilterParams,
  use: (filter: EventFilter) => Effect<A, E>
): Effect<A, E | ProviderError, ProviderService> =>
  Effect.acquireUseRelease(
    Effect.gen(function* () {
      const provider = yield* ProviderService
      return yield* provider.createEventFilter(params)
    }),
    use,
    (filter) => Effect.gen(function* () {
      const provider = yield* ProviderService
      yield* provider.uninstallFilter(filter).pipe(Effect.orDie)
    })
  )

// Event watching as Stream
const watchEvent = (params: {
  address?: Address
  topics?: readonly (Hex | readonly Hex[] | null)[]
  pollingInterval?: number
  fromBlock?: bigint
}): Stream<Log, ProviderError, ProviderService> =>
  Stream.unwrap(
    Effect.gen(function* () {
      const provider = yield* ProviderService
      const pollingInterval = params.pollingInterval ?? 1000
      let currentBlock = params.fromBlock ?? (yield* provider.getBlockNumber())
      
      return Stream.repeatEffectWithSchedule(
        Effect.gen(function* () {
          const latestBlock = yield* provider.getBlockNumber()
          if (latestBlock <= currentBlock) return []
          
          const logs = yield* provider.getLogs({
            address: params.address,
            topics: params.topics,
            fromBlock: currentBlock + 1n,
            toBlock: latestBlock
          })
          
          currentBlock = latestBlock
          return logs
        }),
        Schedule.spaced(Duration.millis(pollingInterval))
      ).pipe(
        Stream.flatMap(logs => Stream.fromIterable(logs))
      )
    })
  )

// Contract event watching
const watchContractEvent = <TAbi extends Abi, TEventName extends string>(params: {
  abi: TAbi
  address: Address
  eventName: TEventName
  args?: Record<string, unknown>
  pollingInterval?: number
  fromBlock?: bigint
}): Stream<DecodedEvent<TAbi, TEventName>, ProviderError, ProviderService> => {
  const topics = encodeEventTopics({
    abi: params.abi,
    eventName: params.eventName,
    args: params.args
  })
  
  return watchEvent({
    address: params.address,
    topics,
    pollingInterval: params.pollingInterval,
    fromBlock: params.fromBlock
  }).pipe(
    Stream.map(log => decodeEventLog({
      abi: params.abi,
      data: log.data,
      topics: log.topics
    }) as DecodedEvent<TAbi, TEventName>)
  )
}

// Pending transaction watching
const watchPendingTransactions = (params?: {
  pollingInterval?: number
}): Stream<Hash, ProviderError, ProviderService> =>
  Stream.unwrap(
    Effect.gen(function* () {
      const provider = yield* ProviderService
      const pollingInterval = params?.pollingInterval ?? 1000
      
      // Try WebSocket subscription first, fallback to filter polling
      const filter = yield* provider.createPendingTransactionFilter()
      
      return Stream.repeatEffectWithSchedule(
        provider.getFilterChanges(filter),
        Schedule.spaced(Duration.millis(pollingInterval))
      ).pipe(
        Stream.flatMap(hashes => Stream.fromIterable(hashes as Hash[])),
        Stream.ensuring(provider.uninstallFilter(filter).pipe(Effect.orDie))
      )
    })
  )

// Block number watching (simpler than full blocks)
const watchBlockNumber = (params?: {
  pollingInterval?: number
  emitOnBegin?: boolean
}): Stream<bigint, ProviderError, ProviderService> =>
  Stream.unwrap(
    Effect.gen(function* () {
      const provider = yield* ProviderService
      const pollingInterval = params?.pollingInterval ?? 1000
      let lastBlock: bigint | undefined
      
      const poll = Stream.repeatEffectWithSchedule(
        Effect.gen(function* () {
          const block = yield* provider.getBlockNumber()
          if (lastBlock === undefined || block > lastBlock) {
            lastBlock = block
            return Option.some(block)
          }
          return Option.none()
        }),
        Schedule.spaced(Duration.millis(pollingInterval))
      ).pipe(
        Stream.filterMap(identity)
      )
      
      if (params?.emitOnBegin) {
        const initial = yield* provider.getBlockNumber()
        lastBlock = initial
        return Stream.concat(Stream.succeed(initial), poll)
      }
      
      return poll
    })
  )
```
</effect_solution>

<implementation>
<new_files>
- src/services/Provider/createEventFilter.ts
- src/services/Provider/createBlockFilter.ts
- src/services/Provider/createPendingTransactionFilter.ts
- src/services/Provider/getFilterChanges.ts
- src/services/Provider/getFilterLogs.ts
- src/services/Provider/uninstallFilter.ts
- src/services/Provider/watchEvent.ts
- src/services/Provider/watchBlockNumber.ts
- src/services/Provider/watchPendingTransactions.ts
- src/primitives/Filter/FilterType.ts
</new_files>

<phases>
1. **Phase 1 - watchEvent Stream** (P0)
   - Polling-based event watching
   - Indexed arg filtering via topics
   - Returns Effect Stream

2. **Phase 2 - watchContractEvent** (P0)
   - Typed contract event watching
   - ABI-aware decoding
   - Add to Contract instance

3. **Phase 3 - Filter Methods** (P1)
   - createEventFilter, createBlockFilter
   - getFilterChanges, getFilterLogs
   - uninstallFilter with resource management

4. **Phase 4 - watchPendingTransactions** (P2)
   - Mempool monitoring
   - Filter-based with fallback

5. **Phase 5 - watchBlockNumber** (P2)
   - Simpler than full blocks
   - Emit only on new blocks

6. **Phase 6 - WebSocket eth_subscribe** (P1)
   - Auto-detect WebSocket transport
   - Use subscription instead of polling
   - Transparent to user code
</phases>
</implementation>

<tests>
```typescript
describe('watchEvent', () => {
  it('streams new events', () =>
    Effect.gen(function* () {
      const events$ = watchEvent({
        address: tokenAddress,
        topics: [transferEventSignature],
        pollingInterval: 100
      })
      
      // Trigger an event
      yield* Effect.fork(triggerTransfer())
      
      const event = yield* Stream.runHead(events$)
      expect(Option.isSome(event)).toBe(true)
    }).pipe(Effect.provide(providerLayer)))
})

describe('watchContractEvent', () => {
  it('streams decoded contract events', () =>
    Effect.gen(function* () {
      const events$ = watchContractEvent({
        abi: erc20Abi,
        address: tokenAddress,
        eventName: 'Transfer',
        args: { from: sender },
        pollingInterval: 100
      })
      
      yield* Effect.fork(triggerTransfer())
      
      const event = yield* Stream.runHead(events$)
      expect(Option.isSome(event)).toBe(true)
      expect(event.value.args.from).toBe(sender)
    }).pipe(Effect.provide(providerLayer)))
})

describe('createEventFilter', () => {
  it('creates and polls filter', () =>
    Effect.gen(function* () {
      const provider = yield* ProviderService
      const filter = yield* provider.createEventFilter({
        address: tokenAddress
      })
      
      expect(filter.id).toMatch(/^0x/)
      expect(filter.type).toBe('event')
      
      const changes = yield* provider.getFilterChanges(filter)
      expect(Array.isArray(changes)).toBe(true)
      
      yield* provider.uninstallFilter(filter)
    }).pipe(Effect.provide(providerLayer)))
})

describe('withEventFilter', () => {
  it('auto-cleans up filter', () =>
    Effect.gen(function* () {
      let filterId: FilterId | undefined
      
      yield* withEventFilter({ address: tokenAddress }, (filter) =>
        Effect.sync(() => { filterId = filter.id })
      )
      
      // Filter should be uninstalled
      const provider = yield* ProviderService
      const result = yield* provider.getFilterChanges({ id: filterId!, type: 'event' }).pipe(
        Effect.either
      )
      expect(Either.isLeft(result)).toBe(true)
    }).pipe(Effect.provide(providerLayer)))
})
```
</tests>

<advantages_over_viem>
Voltaire-effect's Stream-based approach has advantages:
- Composable with Stream operators (map, filter, debounce)
- Effect-based resource management (auto-cleanup)
- Built-in backpressure handling
- Cancellable via fiber interruption
- Type-safe error handling

```typescript
// Stream operators for common patterns
const debouncedBlocks$ = watchBlocks().pipe(
  Stream.debounce(Duration.seconds(1))
)

const batchedEvents$ = watchEvent({ address }).pipe(
  Stream.groupedWithin(100, Duration.seconds(5)),
  Stream.map(Chunk.toReadonlyArray)
)

const filteredTransfers$ = watchContractEvent({
  abi: erc20Abi,
  address: tokenAddress,
  eventName: 'Transfer'
}).pipe(
  Stream.filter(e => e.args.value > 1000n)
)
```
</advantages_over_viem>

<references>
- https://viem.sh/docs/actions/public/watchEvent
- https://viem.sh/docs/actions/public/watchContractEvent
- https://viem.sh/docs/actions/public/createEventFilter
- tevm-monorepo/packages/memory-client/src/test/viem/createEventFilter.spec.ts
- tevm-monorepo/packages/memory-client/src/test/viem/watchContractEvent.spec.ts
</references>
</issue>
