# EventLog.js

Factory function creating Ethereum event log instances.

## Factory

```typescript
EventLog(params: EventLogParams): BrandedEventLog
```

Creates EventLog instance from parameters.

**Parameters:**
- `params.address`: Contract address that emitted the log
- `params.topics`: Array of topic hashes (topic0 = event signature, topic1-3 = indexed parameters)
- `params.data`: Non-indexed event data
- `params.blockNumber`: (optional) Block number where log was emitted
- `params.blockHash`: (optional) Block hash
- `params.transactionHash`: (optional) Transaction hash that generated the log
- `params.transactionIndex`: (optional) Transaction index in block
- `params.logIndex`: (optional) Log index in block
- `params.removed`: (optional) Log removed due to chain reorganization

**Returns:** BrandedEventLog instance

## Static Constructors

### [EventLog.from(params)](./BrandedEventLog/from.js.md)
Loose constructor accepting event log parameters. Same as factory.

### [EventLog.create(params)](./BrandedEventLog/create.js.md)
```typescript
create(params: EventLogParams): BrandedEventLog
```
Creates event log from parameters.

### [EventLog.clone(log)](./BrandedEventLog/clone.js.md)
```typescript
clone(log: BrandedEventLog): BrandedEventLog
```
Deep clones event log including topics array and data bytes.

### [EventLog.copy(log)](./BrandedEventLog/copy.js.md)
```typescript
copy(log: BrandedEventLog): BrandedEventLog
```
Creates shallow copy of event log.

## Static Accessors

### [EventLog.getTopic0(log)](./BrandedEventLog/getTopic0.js.md)
```typescript
getTopic0(log: BrandedEventLog): BrandedHash | undefined
```
Returns topic0 (event signature hash). Returns undefined if no topics.

### [EventLog.getSignature(log)](./BrandedEventLog/getSignature.js.md)
```typescript
getSignature(log: BrandedEventLog): BrandedHash | undefined
```
Alias for getTopic0. Returns event signature hash.

### [EventLog.getIndexedTopics(log)](./BrandedEventLog/getIndexedTopics.js.md)
```typescript
getIndexedTopics(log: BrandedEventLog): readonly BrandedHash[]
```
Returns indexed parameters (topic1-topic3). Excludes topic0.

### [EventLog.getIndexed(log)](./BrandedEventLog/getIndexed.js.md)
```typescript
getIndexed(log: BrandedEventLog): readonly BrandedHash[]
```
Alias for getIndexedTopics.

## Static Filtering

### [EventLog.matchesAddress(log, address)](./BrandedEventLog/matchesAddress.js.md)
```typescript
matchesAddress(log: BrandedEventLog, address: BrandedAddress | BrandedAddress[]): boolean
```
Checks if log matches address filter. Accepts single address or array.

### [EventLog.matchesTopics(log, topics)](./BrandedEventLog/matchesTopics.js.md)
```typescript
matchesTopics(log: BrandedEventLog, topics: readonly (BrandedHash | BrandedHash[] | null)[]): boolean
```
Checks if log matches topic filter. `null` entries match any topic. Array entries match any of the hashes.

**Aliases:** `EventLog.matches(log, topics)`

### [EventLog.matchesFilter(log, filter)](./BrandedEventLog/matchesFilter.js.md)
```typescript
matchesFilter(log: BrandedEventLog, filter: Filter): boolean
```
Checks if log matches complete filter including address, topics, block range, and block hash.

**Aliases:** `EventLog.matchesAll(log, filter)`

### [EventLog.filterLogs(logs, filter)](./BrandedEventLog/filterLogs.js.md)
```typescript
filterLogs(logs: readonly BrandedEventLog[], filter: Filter): BrandedEventLog[]
```
Filters array of logs by filter criteria.

**Aliases:** `EventLog.filter(logs, filter)`

## Static Utilities

### [EventLog.isRemoved(log)](./BrandedEventLog/isRemoved.js.md)
```typescript
isRemoved(log: BrandedEventLog): boolean
```
Checks if log was removed due to chain reorganization.

### [EventLog.wasRemoved(log)](./BrandedEventLog/wasRemoved.js.md)
```typescript
wasRemoved(log: BrandedEventLog): boolean
```
Alias for isRemoved.

### [EventLog.sortLogs(logs)](./BrandedEventLog/sortLogs.js.md)
```typescript
sortLogs(logs: readonly BrandedEventLog[]): BrandedEventLog[]
```
Sorts logs by block number then log index. Returns new sorted array.

**Aliases:** `EventLog.sort(logs)`

## Instance Methods

All static methods available as instance methods:

```javascript
const log = EventLog({
  address: Address.fromHex('0x...'),
  topics: [topic0, topic1],
  data: new Uint8Array([...]),
  blockNumber: 100n,
});

// Accessors
log.getTopic0()          // BrandedHash | undefined
log.getSignature()       // BrandedHash | undefined
log.getIndexedTopics()   // readonly BrandedHash[]
log.getIndexed()         // readonly BrandedHash[]

// Filtering
log.matchesAddress(addr)       // boolean
log.matchesAddr(addr)          // boolean (alias)
log.matchesTopics([t0, null])  // boolean
log.matches([t0, null])        // boolean (alias)
log.matchesFilter(filter)      // boolean
log.matchesAll(filter)         // boolean (alias)

// Utilities
log.isRemoved()          // boolean
log.wasRemoved()         // boolean
log.clone()              // BrandedEventLog
log.copy()               // BrandedEventLog
```

Instance methods delegate to BrandedEventLog namespace functions.

## Implementation

- Plain JavaScript object with `__tag: "EventLog"` brand
- Supports both static (EventLog.method(log, ...)) and instance (log.method(...)) call patterns
- Methods operate on data passed as first argument
- Tree-shakable via namespace pattern

## Example

```javascript
import { EventLog } from './EventLog.js';
import { Address } from '../Address/Address.js';
import { Hash } from '../Hash/Hash.js';

// Create log
const log = EventLog({
  address: Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2'),
  topics: [
    Hash.fromHex('0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'),
    Hash.fromHex('0x000000000000000000000000a1b2c3d4e5f6...'),
    Hash.fromHex('0x000000000000000000000000f6e5d4c3b2a1...'),
  ],
  data: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1]),
  blockNumber: 18000000n,
  logIndex: 5,
});

// Access signature
const signature = log.getTopic0();
console.log(signature); // Transfer event signature

// Get indexed parameters
const indexed = log.getIndexedTopics(); // [from, to]

// Filter logs
const logs = [log1, log2, log3];
const transferLogs = EventLog.filterLogs(logs, {
  address: tokenAddress,
  topics: [transferSignature, null, userAddress], // to user
});

// Sort by block order
const sorted = EventLog.sortLogs(transferLogs);
```
