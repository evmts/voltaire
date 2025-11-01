# EventLog

Ethereum event log structure with filtering and matching operations.

## Overview

EventLog provides type-safe operations for working with Ethereum event logs. All operations are namespaced under `EventLog` and available in both standard form and `this:` pattern for method chaining.

## Event Log Structure

```typescript
type EventLog = {
  address: Address;              // Contract that emitted the log
  topics: readonly Hash[];       // Event signature + indexed parameters
  data: Uint8Array;              // Non-indexed parameters (ABI-encoded)
  blockNumber?: bigint;          // Block where log was emitted
  transactionHash?: Hash;        // Transaction that generated the log
  transactionIndex?: number;     // Transaction index in block
  blockHash?: Hash;              // Block hash
  logIndex?: number;             // Log index in block
  removed?: boolean;             // True if removed due to chain reorg
};
```

### Topics Array

- `topics[0]`: Event signature hash (keccak256 of event signature)
- `topics[1-3]`: Indexed parameters (max 3)
- Anonymous events have no `topics[0]`

## API Reference

### Log Creation

#### `EventLog.create(params)`

Create event log with specified parameters.

```typescript
const log = EventLog.create({
  address: "0x..." as Address,
  topics: [topic0, topic1],
  data: new Uint8Array([...]),
  blockNumber: 100n,
  logIndex: 5,
});
```

### Topic Operations

#### `EventLog.getTopic0(log)` / `getSignature.call(log)`

Get event signature (topic0).

```typescript
const signature = EventLog.getTopic0(log);
// or
const signature = EventLog.getSignature.call(log);
```

#### `EventLog.getIndexedTopics(log)` / `getIndexed.call(log)`

Get indexed parameters (topics 1-3).

```typescript
const indexed = EventLog.getIndexedTopics(log);  // [topic1, topic2, topic3]
// or
const indexed = EventLog.getIndexed.call(log);
```

### Topic Matching

#### `EventLog.matchesTopics(log, filterTopics)` / `matches.call(log, filterTopics)`

Check if log matches topic filter.

**Filter Rules:**
- `null`: Matches any topic (wildcard)
- `Hash`: Must match exactly
- `Hash[]`: Matches if log topic equals any hash in array (OR logic)

```typescript
// Exact match
EventLog.matchesTopics(log, [topic0, topic1, topic2]);

// Wildcard match
EventLog.matchesTopics(log, [topic0, null, topic2]);  // topic1 can be anything

// OR match
EventLog.matchesTopics(log, [[topic0, topic1], topic2, null]);  // topic0 OR topic1

// Using this: pattern
EventLog.matches.call(log, [topic0, null, topic2]);
```

### Address Matching

#### `EventLog.matchesAddress(log, filterAddress)` / `matchesAddr.call(log, filterAddress)`

Check if log matches address filter.

```typescript
// Single address
EventLog.matchesAddress(log, "0x..." as Address);

// Multiple addresses (OR logic)
EventLog.matchesAddress(log, [addr1, addr2, addr3]);

// Using this: pattern
EventLog.matchesAddr.call(log, addr1);
```

### Complete Filter Matching

#### `EventLog.matchesFilter(log, filter)` / `matchesAll.call(log, filter)`

Check if log matches complete filter criteria.

```typescript
const matches = EventLog.matchesFilter(log, {
  address: "0x..." as Address,      // or Address[]
  topics: [topic0, null, topic2],   // with wildcards and OR logic
  fromBlock: 100n,                  // inclusive
  toBlock: 200n,                    // inclusive
  blockHash: blockHash,             // alternative to block range
});

// Using this: pattern
EventLog.matchesAll.call(log, filter);
```

### Array Filtering

#### `EventLog.filterLogs(logs, filter)` / `filter.call(logs, filter)`

Filter array of logs by criteria.

```typescript
const filtered = EventLog.filterLogs(logs, {
  address: [addr1, addr2],
  topics: [topic0],
  fromBlock: 100n,
  toBlock: 200n,
});

// Using this: pattern
const filtered = EventLog.filter.call(logs, filter);
```

### Sorting

#### `EventLog.sortLogs(logs)` / `sort.call(logs)`

Sort logs by block number (ascending), then log index.

```typescript
const sorted = EventLog.sortLogs(logs);  // Does not mutate original

// Using this: pattern
const sorted = EventLog.sort.call(logs);
```

### Removal Checks

#### `EventLog.isRemoved(log)` / `wasRemoved.call(log)`

Check if log was removed due to chain reorganization.

```typescript
if (EventLog.isRemoved(log)) {
  console.log("Log removed due to reorg");
}

// Using this: pattern
if (EventLog.wasRemoved.call(log)) { ... }
```

### Cloning

#### `EventLog.clone(log)` / `copy.call(log)`

Create deep copy of log (topics array and data are cloned).

```typescript
const cloned = EventLog.clone(log);

// Using this: pattern
const cloned = EventLog.copy.call(log);
```

## Common Patterns

### Filter by Event Signature

```typescript
// Get Transfer events from specific contract
const transferSig = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" as Hash;

const transfers = EventLog.filterLogs(logs, {
  address: "0x..." as Address,
  topics: [transferSig],
});
```

### Multi-Contract Query

```typescript
// Get logs from multiple contracts
const filtered = EventLog.filterLogs(logs, {
  address: [contract1, contract2, contract3],
  topics: [eventSig],
});
```

### Indexed Parameter Filtering

```typescript
// Filter Transfer events by sender OR recipient
const filtered = EventLog.filterLogs(logs, {
  topics: [
    transferSig,
    fromAddress,              // topic1: from (indexed)
    [toAddress1, toAddress2]  // topic2: to (indexed, OR logic)
  ],
});
```

### Handle Reorgs

```typescript
// Separate active and removed logs
const activeLogs = logs.filter(log => !EventLog.isRemoved(log));
const removedLogs = logs.filter(log => EventLog.isRemoved(log));

// Process only confirmed logs
const confirmed = EventLog.filterLogs(logs, {
  toBlock: currentBlock - 12n,  // 12 block confirmations
}).filter(log => !EventLog.isRemoved(log));
```

### Chronological Processing

```typescript
// Sort logs before processing
const sorted = EventLog.sortLogs(logs);

for (const log of sorted) {
  // Process in order: block number, then log index
  processLog(log);
}
```

### Event Signature Matching

```typescript
// Match any of multiple event types
const filtered = EventLog.filterLogs(logs, {
  topics: [
    [transferSig, approvalSig, depositSig]  // Match any of these events
  ],
});
```

### Block Range Queries

```typescript
// Get logs from specific block range
const filtered = EventLog.filterLogs(logs, {
  fromBlock: 1000000n,
  toBlock: 1000100n,
});

// Get logs from specific block
const filtered = EventLog.filterLogs(logs, {
  blockHash: blockHash,
});
```

## Best Practices

### Performance

1. **Filter before sort**: Reduce array size before sorting
   ```typescript
   const sorted = EventLog.sortLogs(EventLog.filterLogs(logs, filter));
   ```

2. **Use address arrays**: More efficient than separate filters
   ```typescript
   // Good
   EventLog.filterLogs(logs, { address: [addr1, addr2, addr3] });

   // Less efficient
   logs.filter(log =>
     EventLog.matchesAddress(log, addr1) ||
     EventLog.matchesAddress(log, addr2) ||
     EventLog.matchesAddress(log, addr3)
   );
   ```

3. **Minimize filter complexity**: Start with most restrictive filters
   ```typescript
   // Good: specific address first
   { address: specificAddr, topics: [eventSig] }

   // Less efficient: broad topic first
   { topics: [commonEventSig], address: [many, addresses] }
   ```

### Type Safety

1. **Use const assertions for topics**: Preserve readonly types
   ```typescript
   const topics = [topic0, topic1] as const;
   const log = EventLog.create({ address, topics, data });
   ```

2. **Leverage type inference**: Let TypeScript infer generic types
   ```typescript
   const log = EventLog.create({
     address: specificAddr,
     topics: specificTopics,
     data: specificData,
   });
   // Type preserves specific address and topics types
   ```

### Reorg Handling

1. **Always check removed flag**: Filter removed logs before processing
   ```typescript
   const active = logs.filter(log => !EventLog.isRemoved(log));
   ```

2. **Wait for confirmations**: Filter by block range with buffer
   ```typescript
   const confirmed = EventLog.filterLogs(logs, {
     toBlock: latestBlock - 12n,
   });
   ```

3. **Track log removal**: Monitor removed logs for rollback handling
   ```typescript
   const newlyRemoved = logs.filter(log =>
     EventLog.isRemoved(log) && wasProcessed(log)
   );
   ```

### Memory Management

1. **Clone only when necessary**: Cloning creates new arrays
   ```typescript
   // Clone when modifying
   const modified = EventLog.clone(log);
   modified.data[0] = 0xff;

   // Don't clone when reading
   const signature = EventLog.getTopic0(log);  // No clone needed
   ```

2. **Use filterLogs instead of multiple matches**: Single pass more efficient
   ```typescript
   // Good
   const filtered = EventLog.filterLogs(logs, filter);

   // Less efficient
   const filtered = logs.filter(log => EventLog.matchesFilter(log, filter));
   ```

## Filter Syntax Summary

```typescript
type Filter = {
  address?: Address | Address[];                    // AND if single, OR if array
  topics?: readonly (Hash | Hash[] | null)[];       // Array position = topic index
  fromBlock?: bigint;                               // Inclusive
  toBlock?: bigint;                                 // Inclusive
  blockHash?: Hash;                                 // Alternative to block range
};
```

**Topic Filter Examples:**
- `[topic0]` - Match topic0 exactly
- `[null]` - Match any topic0
- `[[topic0, topic1]]` - Match topic0 OR topic1
- `[topic0, null, topic2]` - Match topic0, any topic1, topic2
- `[]` - Match all logs (no topic filter)

**Address Filter Examples:**
- `addr1` - Match single address
- `[addr1, addr2]` - Match addr1 OR addr2
- `undefined` - Match all addresses

## See Also

- [ABI](./abi.md) - For decoding log data
- [Hash](./hash.md) - For topic hashing
- [Address](./address.md) - For address operations
