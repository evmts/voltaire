---
title: "EventLog Utilities"
---

# EventLog Utilities

Utility methods for working with event logs.

## EventLog.isRemoved(log)

Checks if log was removed due to chain reorganization.

```typescript
isRemoved(log: BrandedEventLog): boolean
```

**Parameters:**
- `log`: Event log to check

**Returns:** `true` if log.removed === true

**Details:**
- Checks the `removed` field which indicates chain reorg
- Returns false if removed field is false or undefined
- Used to filter out invalidated logs

**Example:**
```javascript
const log = EventLog({
  address: contractAddress,
  topics: [eventSig],
  data: new Uint8Array([]),
  removed: true, // marked as removed due to reorg
});

const removed = EventLog.isRemoved(log);
// or
const removed = log.isRemoved();
console.log(removed); // true
```

## EventLog.wasRemoved(log)

Alias for isRemoved.

```typescript
wasRemoved(log: BrandedEventLog): boolean
```

**Parameters:**
- `log`: Event log to check

**Returns:** `true` if log.removed === true

**Example:**
```javascript
const log = EventLog({ /* ... */ });

const removed = EventLog.wasRemoved(log);
// or
const removed = log.wasRemoved();

// Both equivalent to isRemoved
```

## EventLog.sortLogs(logs)

Sorts logs by block number then log index.

```typescript
sortLogs(logs: readonly BrandedEventLog[]): BrandedEventLog[]
```

**Parameters:**
- `logs`: Array of event logs to sort

**Returns:** New array sorted by block number (ascending) then log index (ascending)

**Aliases:** `EventLog.sort(logs)`

**Details:**
- Creates new sorted array (doesn't modify input)
- Primary sort: block number (ascending)
- Secondary sort: log index (ascending)
- Logs without blockNumber treated as block 0
- Logs without logIndex treated as index 0

**Example:**
```javascript
const logs = [
  EventLog({ /* ... */ blockNumber: 18000002n, logIndex: 5 }),
  EventLog({ /* ... */ blockNumber: 18000001n, logIndex: 10 }),
  EventLog({ /* ... */ blockNumber: 18000002n, logIndex: 2 }),
];

const sorted = EventLog.sortLogs(logs);
// or
const sorted = EventLog.sort(logs);

// Result order:
// 1. blockNumber: 18000001n, logIndex: 10
// 2. blockNumber: 18000002n, logIndex: 2
// 3. blockNumber: 18000002n, logIndex: 5
```

## Usage Patterns

### Filtering Active Logs

```javascript
// Remove logs invalidated by chain reorg
const activeLogs = allLogs.filter(log => !log.isRemoved());

// Equivalent
const activeLogs = allLogs.filter(log => !EventLog.isRemoved(log));
```

### Sorting After Filtering

```javascript
// Get all Transfer events sorted chronologically
const transferLogs = EventLog.filterLogs(allLogs, {
  topics: [TRANSFER_SIG],
});

const sorted = EventLog.sortLogs(transferLogs);
```

### Processing Logs in Order

```javascript
// Process logs in blockchain order
const sortedLogs = EventLog.sortLogs(allLogs);

for (const log of sortedLogs) {
  if (log.isRemoved()) {
    console.log('Skipping removed log');
    continue;
  }

  processLog(log);
}
```

### Finding Latest Log

```javascript
// Get most recent log
const sorted = EventLog.sortLogs(logs);
const latest = sorted[sorted.length - 1];

console.log('Latest block:', latest.blockNumber);
console.log('Latest index:', latest.logIndex);
```

### Grouping by Block

```javascript
// Group logs by block number
const sortedLogs = EventLog.sortLogs(allLogs);

const byBlock = new Map();
for (const log of sortedLogs) {
  const blockNum = log.blockNumber ?? 0n;
  if (!byBlock.has(blockNum)) {
    byBlock.set(blockNum, []);
  }
  byBlock.get(blockNum).push(log);
}

// Process each block's logs in order
for (const [blockNumber, blockLogs] of byBlock) {
  console.log(`Block ${blockNumber}: ${blockLogs.length} logs`);
  // blockLogs already sorted by logIndex within block
}
```

### Detecting Reorgs

```javascript
// Compare two sets of logs to detect removed events
function detectReorg(oldLogs, newLogs) {
  const removed = newLogs.filter(log => log.isRemoved());

  if (removed.length > 0) {
    console.log(`Detected reorg: ${removed.length} logs removed`);

    for (const log of removed) {
      console.log(`Block ${log.blockNumber}, Index ${log.logIndex}`);
    }
  }
}
```

### Merging Log Sources

```javascript
// Merge logs from multiple sources and sort
const logsFromRpc1 = fetchLogs(rpc1, filter);
const logsFromRpc2 = fetchLogs(rpc2, filter);

const allLogs = [...logsFromRpc1, ...logsFromRpc2];
const dedupedLogs = deduplicateLogs(allLogs);
const sorted = EventLog.sortLogs(dedupedLogs);
```

### Time-Ordered Processing

```javascript
// Process events in exact blockchain order
const sorted = EventLog.sortLogs(allLogs)
  .filter(log => !log.wasRemoved());

let prevBlock = 0n;
for (const log of sorted) {
  if (log.blockNumber > prevBlock) {
    console.log(`\nProcessing block ${log.blockNumber}`);
    prevBlock = log.blockNumber;
  }

  console.log(`  Log ${log.logIndex}: ${log.address}`);
}
```

### Handling Missing Metadata

```javascript
// Sort handles missing blockNumber/logIndex gracefully
const logs = [
  EventLog({ /* ... */ blockNumber: 100n }), // no logIndex
  EventLog({ /* ... */ }), // no blockNumber or logIndex
  EventLog({ /* ... */ blockNumber: 50n, logIndex: 5 }),
];

const sorted = EventLog.sortLogs(logs);
// Logs without blockNumber treated as block 0
// Logs without logIndex treated as index 0
```

### Verifying Log Order

```javascript
function verifyLogOrder(logs) {
  for (let i = 1; i < logs.length; i++) {
    const prev = logs[i - 1];
    const curr = logs[i];

    const prevBlock = prev.blockNumber ?? 0n;
    const currBlock = curr.blockNumber ?? 0n;

    if (currBlock < prevBlock) {
      throw new Error('Logs not sorted by block');
    }

    if (currBlock === prevBlock) {
      const prevIndex = prev.logIndex ?? 0;
      const currIndex = curr.logIndex ?? 0;

      if (currIndex < prevIndex) {
        throw new Error('Logs not sorted by index within block');
      }
    }
  }

  return true;
}

const sorted = EventLog.sortLogs(unsortedLogs);
verifyLogOrder(sorted); // true
```

### Pagination with Sorting

```javascript
// Sort and paginate logs
function paginateLogs(logs, page, pageSize) {
  const sorted = EventLog.sortLogs(logs);
  const start = page * pageSize;
  const end = start + pageSize;

  return {
    logs: sorted.slice(start, end),
    total: sorted.length,
    page,
    pageSize,
    hasMore: end < sorted.length,
  };
}

const result = paginateLogs(allLogs, 0, 100);
console.log(`Page 1: ${result.logs.length} logs`);
```

## Sort Implementation Details

The sort algorithm:

1. Compares block numbers first
   - Treats undefined blockNumber as 0n
   - Returns -1 if blockA < blockB
   - Returns 1 if blockA > blockB

2. If block numbers equal, compares log indices
   - Treats undefined logIndex as 0
   - Returns indexA - indexB

3. Creates new array (doesn't modify input)

```javascript
// Equivalent implementation
function sortLogs(logs) {
  return [...logs].sort((a, b) => {
    const blockA = a.blockNumber ?? 0n;
    const blockB = b.blockNumber ?? 0n;

    if (blockA !== blockB) {
      return blockA < blockB ? -1 : 1;
    }

    const indexA = a.logIndex ?? 0;
    const indexB = b.logIndex ?? 0;
    return indexA - indexB;
  });
}
```

## Chain Reorganization Handling

Chain reorgs can cause logs to be removed:

```javascript
// Initial state
const log = EventLog({
  address: contractAddress,
  topics: [TRANSFER_SIG],
  data: valueData,
  blockNumber: 18000000n,
  blockHash: Hash.fromHex('0xabc...'),
  removed: false,
});

// After reorg, same log marked as removed
const updatedLog = {
  ...log,
  removed: true,
};

console.log(log.isRemoved()); // false
console.log(updatedLog.isRemoved()); // true

// Filter out removed logs
const validLogs = logs.filter(log => !log.wasRemoved());
```

## Implementation Notes

- isRemoved/wasRemoved check strict equality with true
- sortLogs creates new array using spread operator
- Sort uses bigint comparison for block numbers
- Sort stable (maintains relative order of equal elements)
- Missing blockNumber defaults to 0n for sorting
- Missing logIndex defaults to 0 for sorting
- removed field defaults to false in create()
- All utilities work with both static and instance call patterns
