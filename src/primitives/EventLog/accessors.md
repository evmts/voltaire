---
title: "EventLog Accessors"
---

# EventLog Accessors

Methods for accessing event log data and extracting specific fields.

## EventLog.getTopic0(log)

Returns topic0 (event signature hash) from log.

```typescript
getTopic0(log: BrandedEventLog): BrandedHash | undefined
```

**Parameters:**
- `log`: Event log instance

**Returns:** Topic0 hash, or undefined if topics array is empty

**Details:**
- Topic0 is first element of topics array
- Typically contains Keccak-256 hash of event signature
- For anonymous events, topic0 may be first indexed parameter

**Example:**
```javascript
const log = EventLog({
  address: contractAddress,
  topics: [
    Hash.fromHex('0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'),
    Hash.fromHex('0x000000000000000000000000a1b2c3d4e5f6...'),
  ],
  data: new Uint8Array([]),
});

const topic0 = EventLog.getTopic0(log);
// or
const topic0 = log.getTopic0();

console.log(Hash.toHex(topic0));
// '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
```

## EventLog.getSignature(log)

Alias for getTopic0. Returns event signature hash.

```typescript
getSignature(log: BrandedEventLog): BrandedHash | undefined
```

**Parameters:**
- `log`: Event log instance

**Returns:** Event signature hash, or undefined if no topics

**Example:**
```javascript
const log = EventLog({ /* ... */ });

const signature = EventLog.getSignature(log);
// or
const signature = log.getSignature();

// Both equivalent to getTopic0
```

## EventLog.getIndexedTopics(log)

Returns indexed parameters (topic1-topic3), excluding topic0.

```typescript
getIndexedTopics(log: BrandedEventLog): readonly BrandedHash[]
```

**Parameters:**
- `log`: Event log instance

**Returns:** Read-only array of indexed topic hashes

**Details:**
- Returns topics.slice(1)
- Maximum 3 indexed parameters in Solidity
- Empty array if log has 0-1 topics

**Example:**
```javascript
// Transfer(address indexed from, address indexed to, uint256 value)
const log = EventLog({
  address: tokenAddress,
  topics: [
    Hash.fromHex('0xddf252ad...'), // event signature
    Hash.fromHex('0x000...a1b'),   // from address
    Hash.fromHex('0x000...f6e'),   // to address
  ],
  data: Hex.toBytes('0x0000...0001'), // value (not indexed)
});

const indexed = EventLog.getIndexedTopics(log);
// or
const indexed = log.getIndexedTopics();

console.log(indexed.length); // 2
console.log(Hash.toHex(indexed[0])); // from address
console.log(Hash.toHex(indexed[1])); // to address
```

## EventLog.getIndexed(log)

Alias for getIndexedTopics.

```typescript
getIndexed(log: BrandedEventLog): readonly BrandedHash[]
```

**Parameters:**
- `log`: Event log instance

**Returns:** Read-only array of indexed topic hashes

**Example:**
```javascript
const log = EventLog({ /* ... */ });

const indexed = EventLog.getIndexed(log);
// or
const indexed = log.getIndexed();

// Both equivalent to getIndexedTopics
```

## Usage Patterns

### Decoding Transfer Events

```javascript
// Transfer(address indexed from, address indexed to, uint256 value)
const TRANSFER_SIG = Hash.fromHex(
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
);

function decodeTransfer(log) {
  const signature = log.getSignature();
  if (!Hash.equals(signature, TRANSFER_SIG)) {
    throw new Error('Not a Transfer event');
  }

  const [fromHash, toHash] = log.getIndexedTopics();

  // Extract addresses from topic hashes (last 20 bytes)
  const from = Address.fromBytes(fromHash.slice(12));
  const to = Address.fromBytes(toHash.slice(12));

  // Decode value from data
  const value = new DataView(log.data.buffer).getBigUint64(0, false);

  return { from, to, value };
}
```

### Extracting Indexed Parameters

```javascript
// Approval(address indexed owner, address indexed spender, uint256 value)
const log = EventLog({ /* approval event */ });

const signature = log.getTopic0();
const [ownerHash, spenderHash] = log.getIndexed();

console.log('Event:', Hash.toHex(signature));
console.log('Owner:', Hash.toHex(ownerHash));
console.log('Spender:', Hash.toHex(spenderHash));
```

### Checking Topic Count

```javascript
function validateEventStructure(log, expectedTopicCount) {
  const indexed = log.getIndexedTopics();

  if (indexed.length !== expectedTopicCount) {
    throw new Error(
      `Expected ${expectedTopicCount} indexed params, got ${indexed.length}`
    );
  }

  return true;
}

// Transfer has 2 indexed parameters (from, to)
validateEventStructure(transferLog, 2);
```

### Working with Anonymous Events

```javascript
// Anonymous events don't have topic0 signature
const anonymousLog = EventLog({
  address: contractAddress,
  topics: [
    Hash.fromHex('0x000...abc'), // indexed param 1
    Hash.fromHex('0x000...def'), // indexed param 2
  ],
  data: eventData,
});

const signature = anonymousLog.getTopic0();
console.log(signature); // First indexed parameter, not event signature

const indexed = anonymousLog.getIndexedTopics();
console.log(indexed.length); // 1 (remaining indexed params)
```

### Filtering by Signature

```javascript
const logs = [log1, log2, log3];

// Find all Transfer events
const transferLogs = logs.filter(log => {
  const sig = log.getSignature();
  return sig && Hash.equals(sig, TRANSFER_SIG);
});
```

### Accessing Topics Directly

```javascript
const log = EventLog({ /* ... */ });

// Direct access to topics array
console.log(log.topics.length); // All topics including topic0
console.log(log.topics[0]); // topic0 (signature)
console.log(log.topics[1]); // topic1 (first indexed param)

// Using accessors
console.log(log.getTopic0()); // topic0
console.log(log.getIndexedTopics()); // [topic1, topic2, ...]
```

## Implementation Notes

- All accessors return references to log data, not copies
- getTopic0/getSignature return undefined for logs with empty topics array
- getIndexedTopics/getIndexed return empty array if log has 0-1 topics
- Returned arrays from getIndexedTopics are read-only
- No validation performed on topic structure
- Works with both named and anonymous events
- Topic hashes are 32-byte BrandedHash values
