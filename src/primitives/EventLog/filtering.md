---
title: "EventLog Filtering"
---

# EventLog Filtering

Methods for filtering event logs by address, topics, and complete filter criteria.

## EventLog.matchesAddress(log, address)

Checks if log matches address filter.

```typescript
matchesAddress(log: BrandedEventLog, address: BrandedAddress | BrandedAddress[]): boolean
```

**Parameters:**
- `log`: Event log to check
- `address`: Single address or array of addresses to match

**Returns:** `true` if log.address matches any of the filter addresses

**Aliases:** `EventLog.matchesAddr(log, address)`

**Example:**
```javascript
const log = EventLog({
  address: Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2'),
  topics: [eventSig],
  data: new Uint8Array([]),
});

// Single address
const matches1 = EventLog.matchesAddress(log, tokenAddress);
// or
const matches1 = log.matchesAddress(tokenAddress);

// Multiple addresses (OR logic)
const matches2 = EventLog.matchesAddress(log, [usdcAddress, daiAddress, wethAddress]);
console.log(matches2); // true if log.address is any of the three
```

## EventLog.matchesTopics(log, topics)

Checks if log matches topic filter.

```typescript
matchesTopics(
  log: BrandedEventLog,
  topics: readonly (BrandedHash | BrandedHash[] | null)[]
): boolean
```

**Parameters:**
- `log`: Event log to check
- `topics`: Topic filter array
  - `null` entries match any topic
  - Single hash matches that specific topic
  - Array of hashes matches any of those topics (OR logic)

**Returns:** `true` if all non-null filter topics match

**Aliases:** `EventLog.matches(log, topics)`

**Details:**
- Compares log topics element-by-element with filter topics
- `null` filter topic matches any log topic value
- Array filter topic matches if log topic equals any array element
- Returns false if filter longer than log topics

**Example:**
```javascript
// Transfer(address indexed from, address indexed to, uint256 value)
const TRANSFER_SIG = Hash.fromHex('0xddf252ad...');
const USER_ADDRESS_HASH = Hash.fromHex('0x000000000000000000000000a1b2c3d4...');

const log = EventLog({
  address: tokenAddress,
  topics: [
    TRANSFER_SIG,
    Hash.fromHex('0x000...abc'), // from
    USER_ADDRESS_HASH,           // to
  ],
  data: valueData,
});

// Match specific signature, any from, specific to
const matches1 = EventLog.matchesTopics(log, [
  TRANSFER_SIG,
  null,              // any from address
  USER_ADDRESS_HASH, // to our user
]);
console.log(matches1); // true

// Match signature and any of multiple addresses
const matches2 = log.matchesTopics([
  TRANSFER_SIG,
  null,
  [USER_ADDR_1, USER_ADDR_2, USER_ADDR_3], // to any of these
]);
```

## EventLog.matchesFilter(log, filter)

Checks if log matches complete filter criteria.

```typescript
matchesFilter(log: BrandedEventLog, filter: Filter): boolean
```

**Parameters:**
- `log`: Event log to check
- `filter`: Filter object with optional fields:
  - `address?`: Address or array of addresses
  - `topics?`: Topic filter array
  - `fromBlock?`: Starting block number (inclusive)
  - `toBlock?`: Ending block number (inclusive)
  - `blockHash?`: Specific block hash

**Returns:** `true` if log matches all specified filter criteria

**Aliases:** `EventLog.matchesAll(log, filter)`

**Details:**
- Checks address filter if present
- Checks topics filter if present
- Checks block range if blockNumber and fromBlock/toBlock present
- Checks blockHash if both present
- Returns true if all specified criteria match

**Example:**
```javascript
const log = EventLog({
  address: tokenAddress,
  topics: [TRANSFER_SIG, fromHash, toHash],
  data: valueData,
  blockNumber: 18000000n,
  blockHash: Hash.fromHex('0x...'),
});

// Complete filter
const matches1 = EventLog.matchesFilter(log, {
  address: tokenAddress,
  topics: [TRANSFER_SIG, null, userAddressHash],
  fromBlock: 17000000n,
  toBlock: 19000000n,
});
console.log(matches1); // true

// Instance method
const matches2 = log.matchesFilter({
  address: [usdcAddress, daiAddress],
  topics: [TRANSFER_SIG],
});

// Partial filter (only address)
const matches3 = log.matchesAll({ address: tokenAddress });
```

## EventLog.filterLogs(logs, filter)

Filters array of logs by filter criteria.

```typescript
filterLogs(logs: readonly BrandedEventLog[], filter: Filter): BrandedEventLog[]
```

**Parameters:**
- `logs`: Array of event logs to filter
- `filter`: Filter criteria (same as matchesFilter)

**Returns:** New array containing only logs matching filter

**Example:**
```javascript
const allLogs = [log1, log2, log3, log4, log5];

// Filter for Transfer events to specific user
const transfersToUser = EventLog.filterLogs(allLogs, {
  address: tokenAddress,
  topics: [TRANSFER_SIG, null, userAddressHash],
  fromBlock: 18000000n,
});

// Multiple contracts
const filtered = EventLog.filterLogs(allLogs, {
  address: [usdc, dai, weth],
  topics: [TRANSFER_SIG],
});
```

## Usage Patterns

### Simple Address Filter

```javascript
const logs = [log1, log2, log3];

// Find all logs from specific contract
const tokenLogs = logs.filter(log =>
  log.matchesAddress(tokenAddress)
);

// Find all logs from any of several contracts
const dexLogs = logs.filter(log =>
  log.matchesAddress([uniswapV2, uniswapV3, sushiswap])
);
```

### Topic Pattern Matching

```javascript
// Transfer(address indexed from, address indexed to, uint256 value)
const TRANSFER_SIG = Hash.fromHex('0xddf252ad...');

// All transfers FROM specific address
const outgoing = logs.filter(log =>
  log.matchesTopics([TRANSFER_SIG, userAddressHash, null])
);

// All transfers TO specific address
const incoming = logs.filter(log =>
  log.matchesTopics([TRANSFER_SIG, null, userAddressHash])
);

// Transfers between any of several addresses
const intraGroup = logs.filter(log =>
  log.matchesTopics([
    TRANSFER_SIG,
    [addr1Hash, addr2Hash, addr3Hash],
    [addr1Hash, addr2Hash, addr3Hash],
  ])
);
```

### Block Range Filtering

```javascript
// Logs in specific block range
const rangedLogs = EventLog.filterLogs(allLogs, {
  address: tokenAddress,
  fromBlock: 18000000n,
  toBlock: 18001000n,
});

// Logs in specific block
const blockLogs = EventLog.filterLogs(allLogs, {
  blockHash: Hash.fromHex('0x...'),
});
```

### Multiple Event Types

```javascript
const TRANSFER_SIG = Hash.fromHex('0xddf252ad...');
const APPROVAL_SIG = Hash.fromHex('0x8c5be1e5...');

// Transfer OR Approval events
const relevantLogs = logs.filter(log =>
  log.matchesTopics([[TRANSFER_SIG, APPROVAL_SIG]]) // OR logic
);
```

### Complex Filtering

```javascript
// All Transfer events to user from USDC or DAI in block range
const filtered = EventLog.filterLogs(allLogs, {
  address: [usdcAddress, daiAddress],
  topics: [
    TRANSFER_SIG,
    null, // from any
    userAddressHash, // to user
  ],
  fromBlock: 18000000n,
  toBlock: 18500000n,
});
```

### Combining Filters

```javascript
// First filter by contract, then by user
const tokenLogs = EventLog.filterLogs(allLogs, {
  address: tokenAddress,
});

const userLogs = tokenLogs.filter(log =>
  log.matchesTopics([null, null, userAddressHash]) ||
  log.matchesTopics([null, userAddressHash, null])
);
```

### Manual Filtering Logic

```javascript
// Custom filter combining matchesAddress and matchesTopics
const customFiltered = logs.filter(log => {
  const isRightContract = log.matchesAddress([usdc, dai]);
  const isTransferToUser = log.matchesTopics([TRANSFER_SIG, null, userHash]);
  const isRecentBlock = log.blockNumber >= 18000000n;

  return isRightContract && isTransferToUser && isRecentBlock;
});
```

### Negation Filters

```javascript
// All logs EXCEPT from specific address
const notFromAddress = logs.filter(log =>
  !log.matchesAddress(excludedAddress)
);

// All events EXCEPT Transfer
const notTransfer = logs.filter(log => {
  const sig = log.getTopic0();
  return !Hash.equals(sig, TRANSFER_SIG);
});
```

## Filter Semantics

### Address Filtering
- `undefined`: Matches all addresses
- Single address: Matches that exact address
- Array of addresses: Matches any address in array (OR logic)

### Topic Filtering
- `undefined`: No topic filtering
- Empty array: Matches all logs
- `null` element: Matches any topic at that position
- Single hash: Matches that exact hash at that position
- Array of hashes: Matches any hash in array at that position (OR logic)

### Block Filtering
- `fromBlock`: Inclusive lower bound, requires log.blockNumber
- `toBlock`: Inclusive upper bound, requires log.blockNumber
- `blockHash`: Exact block match, requires log.blockHash

### Combined Logic
- All specified filters use AND logic
- Within address array: OR logic
- Within topic position array: OR logic
- Filter returns true only if all criteria match

## Implementation Notes

- Uses constant-time address comparison via addressEquals
- Uses constant-time hash comparison via hashEquals
- filterLogs returns new array, doesn't modify input
- matchesFilter returns false if log missing required fields for comparison
- Topic filter allows fewer filter topics than log topics
- Topic filter fails if more filter topics than log topics
- Block range checks only apply if both filter field and log field present
- All filtering methods work with both static and instance call patterns
