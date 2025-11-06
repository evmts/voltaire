---
title: "EventLog Constructors"
---

# EventLog Constructors

Methods for creating and copying event log instances.

## EventLog(params)

Factory function - primary constructor.

```typescript
EventLog(params: EventLogParams): BrandedEventLog
```

**Parameters:**
- `address`: Contract address that emitted the log
- `topics`: Array of topic hashes (topic0 = event signature, topic1-3 = indexed parameters)
- `data`: Non-indexed event data as Uint8Array
- `blockNumber?`: Block number where log was emitted
- `blockHash?`: Block hash
- `transactionHash?`: Transaction hash that generated the log
- `transactionIndex?`: Transaction index in block
- `logIndex?`: Log index in block
- `removed?`: Whether log was removed due to chain reorganization (default: false)

**Returns:** BrandedEventLog instance

**Example:**
```javascript
const log = EventLog({
  address: Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2'),
  topics: [
    Hash.fromHex('0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'),
    Hash.fromHex('0x000000000000000000000000a1b2c3d4e5f6...'),
    Hash.fromHex('0x000000000000000000000000f6e5d4c3b2a1...'),
  ],
  data: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1]),
  blockNumber: 18000000n,
  transactionHash: Hash.fromHex('0x...'),
  logIndex: 5,
});
```

## EventLog.from(params)

Alias for factory function. Creates EventLog from parameters.

```typescript
from(params: EventLogParams): BrandedEventLog
```

Same parameters and behavior as factory function.

**Example:**
```javascript
const log = EventLog.from({
  address: contractAddress,
  topics: [eventSignature, indexedParam1],
  data: eventData,
  blockNumber: 18000000n,
});
```

## EventLog.create(params)

Explicit constructor. Creates EventLog from parameters.

```typescript
create(params: EventLogParams): BrandedEventLog
```

Same parameters and behavior as factory function.

**Example:**
```javascript
const log = EventLog.create({
  address: contractAddress,
  topics: [eventSignature],
  data: new Uint8Array([]),
});
```

## EventLog.clone(log)

Deep clones event log including topics array and data bytes.

```typescript
clone(log: BrandedEventLog): BrandedEventLog
```

**Parameters:**
- `log`: Event log to clone

**Returns:** Deep cloned event log

**Details:**
- Creates new topics array
- Creates new Uint8Array copy of data
- Copies all other properties

**Example:**
```javascript
const original = EventLog.create({
  address: contractAddress,
  topics: [eventSignature],
  data: new Uint8Array([1, 2, 3]),
});

const cloned = EventLog.clone(original);
// or
const cloned2 = original.clone();

// Modifications don't affect original
cloned.data[0] = 99;
console.log(original.data[0]); // 1
```

## EventLog.copy(log)

Shallow copies event log.

```typescript
copy(log: BrandedEventLog): BrandedEventLog
```

**Parameters:**
- `log`: Event log to copy

**Returns:** Shallow copied event log

**Details:**
- Uses object spread
- topics and data arrays are shared references

**Example:**
```javascript
const original = EventLog.create({
  address: contractAddress,
  topics: [eventSignature],
  data: new Uint8Array([1, 2, 3]),
});

const copied = EventLog.copy(original);
// or
const copied2 = original.copy();
```

## Usage Patterns

### Creating from RPC Response

```javascript
// Transform RPC log response
const rpcLog = {
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2',
  topics: [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    '0x000000000000000000000000a1b2c3d4e5f6...',
  ],
  data: '0x0000000000000000000000000000000000000000000000000000000000000001',
  blockNumber: '0x112a880',
  transactionHash: '0x...',
  logIndex: '0x5',
};

const log = EventLog({
  address: Address.fromHex(rpcLog.address),
  topics: rpcLog.topics.map(Hash.fromHex),
  data: Hex.toBytes(rpcLog.data),
  blockNumber: BigInt(rpcLog.blockNumber),
  transactionHash: Hash.fromHex(rpcLog.transactionHash),
  logIndex: Number(rpcLog.logIndex),
});
```

### Creating Test Logs

```javascript
// Minimal test log
const testLog = EventLog({
  address: Address.zero(),
  topics: [Hash.fromHex('0xddf252ad...')],
  data: new Uint8Array([]),
});

// With all fields
const fullLog = EventLog({
  address: Address.fromHex('0x...'),
  topics: [eventSig, from, to],
  data: Hex.toBytes('0x0000...0001'),
  blockNumber: 18000000n,
  blockHash: Hash.fromHex('0x...'),
  transactionHash: Hash.fromHex('0x...'),
  transactionIndex: 10,
  logIndex: 5,
  removed: false,
});
```

### Cloning for Modifications

```javascript
const log = EventLog({ /* ... */ });

// Clone before modifying
const modified = EventLog.clone(log);
modified.removed = true;

// Original unchanged
console.log(log.removed); // false
console.log(modified.removed); // true
```

## Implementation Notes

- EventLog is branded plain object with `__tag: "EventLog"`
- No validation performed - assumes valid Address and Hash inputs
- Optional fields only included if provided
- `removed` defaults to `false` if not specified
- All constructors return same BrandedEventLog type
- Clone creates independent copies of mutable fields (topics array, data bytes)
- Copy creates shallow copy sharing array references
