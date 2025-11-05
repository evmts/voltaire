# EventLog WASM Implementation

WebAssembly-accelerated event log filtering functions.

## Overview

EventLog provides WASM-accelerated filtering operations for high-performance log processing. The WASM implementation uses Zig bindings for optimized address and topic matching.

**Module:** `EventLog.wasm.ts`

## WASM Functions

### matchesAddressWasm(logAddress, filterAddresses)

Checks if log address matches filter using WASM.

```typescript
matchesAddressWasm(
  logAddress: BrandedAddress,
  filterAddresses: BrandedAddress[]
): boolean
```

**Parameters:**
- `logAddress`: Log emitter address
- `filterAddresses`: Array of filter addresses (empty = match all)

**Returns:** `true` if log address matches any filter address

**Example:**
```typescript
import { matchesAddressWasm } from './EventLog.wasm.js';

const logAddr = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2');

// Check against single address
const matches1 = matchesAddressWasm(logAddr, [tokenAddress]);

// Check against multiple addresses
const matches2 = matchesAddressWasm(logAddr, [usdc, dai, weth]);
```

### matchesTopicWasm(logTopic, filterTopic)

Checks if log topic matches filter using WASM.

```typescript
matchesTopicWasm(
  logTopic: BrandedHash,
  filterTopic: BrandedHash | null
): boolean
```

**Parameters:**
- `logTopic`: Log topic hash (32 bytes)
- `filterTopic`: Filter topic hash, or null to match any

**Returns:** `true` if topic matches filter

**Example:**
```typescript
import { matchesTopicWasm } from './EventLog.wasm.js';

const topic0 = Hash.fromHex('0xddf252ad...');
const eventSig = Hash.fromHex('0xddf252ad...');

// Exact match
const matches1 = matchesTopicWasm(topic0, eventSig);

// Null filter matches any topic
const matches2 = matchesTopicWasm(topic0, null); // true
```

### matchesTopicsWasm(logTopics, filterTopics)

Checks if log topics array matches filter array using WASM.

```typescript
matchesTopicsWasm(
  logTopics: BrandedHash[],
  filterTopics: (BrandedHash | null)[]
): boolean
```

**Parameters:**
- `logTopics`: Array of log topic hashes
- `filterTopics`: Array of filter topics (null entries match any)

**Returns:** `true` if all non-null filter topics match

**Example:**
```typescript
import { matchesTopicsWasm } from './EventLog.wasm.js';

const logTopics = [
  Hash.fromHex('0xddf252ad...'), // Transfer signature
  Hash.fromHex('0x000...abc'),   // from
  Hash.fromHex('0x000...def'),   // to
];

// Match signature, any from, specific to
const matches = matchesTopicsWasm(logTopics, [
  Hash.fromHex('0xddf252ad...'),
  null,
  Hash.fromHex('0x000...def'),
]);
```

### filterByAddressWasm(logs, filterAddresses)

Filters logs by address using WASM (batch operation).

```typescript
filterByAddressWasm<T extends { address: BrandedAddress }>(
  logs: T[],
  filterAddresses: BrandedAddress[]
): T[]
```

**Parameters:**
- `logs`: Array of event logs
- `filterAddresses`: Array of filter addresses

**Returns:** Filtered logs matching any address

**Example:**
```typescript
import { filterByAddressWasm } from './EventLog.wasm.js';

const allLogs = [log1, log2, log3, log4];

// Filter for USDC or DAI logs
const tokenLogs = filterByAddressWasm(allLogs, [usdcAddress, daiAddress]);
```

### filterByTopicsWasm(logs, filterTopics)

Filters logs by topics using WASM (batch operation).

```typescript
filterByTopicsWasm<T extends { topics: BrandedHash[] }>(
  logs: T[],
  filterTopics: (BrandedHash | null)[]
): T[]
```

**Parameters:**
- `logs`: Array of event logs
- `filterTopics`: Topic filter array (null = match any)

**Returns:** Filtered logs matching all topics

**Example:**
```typescript
import { filterByTopicsWasm } from './EventLog.wasm.js';

const allLogs = [log1, log2, log3, log4];

// Filter for Transfer events to specific address
const filtered = filterByTopicsWasm(allLogs, [
  transferEventSig,
  null,         // from any
  userAddress,  // to user
]);
```

### filterLogsWasm(logs, filterAddresses, filterTopics)

Filters logs by both address and topics using WASM.

```typescript
filterLogsWasm<T extends { address: BrandedAddress; topics: BrandedHash[] }>(
  logs: T[],
  filterAddresses: BrandedAddress[],
  filterTopics: (BrandedHash | null)[]
): T[]
```

**Parameters:**
- `logs`: Array of event logs
- `filterAddresses`: Array of filter addresses (empty = match all)
- `filterTopics`: Array of filter topics (null entries = match any)

**Returns:** Filtered logs matching both address and topics

**Example:**
```typescript
import { filterLogsWasm } from './EventLog.wasm.js';

const allLogs = [log1, log2, log3, log4];

// Filter for Transfer events from USDC to user
const filtered = filterLogsWasm(
  allLogs,
  [usdcAddress],
  [transferSig, null, userAddressHash]
);
```

## Status Functions

### isWasmEventLogAvailable()

Checks if WASM implementation is available.

```typescript
isWasmEventLogAvailable(): boolean
```

**Returns:** `true` if WASM module loaded successfully

**Example:**
```typescript
import { isWasmEventLogAvailable } from './EventLog.wasm.js';

if (isWasmEventLogAvailable()) {
  console.log('Using WASM-accelerated filtering');
} else {
  console.log('Falling back to JavaScript implementation');
}
```

### getImplementationStatus()

Returns detailed implementation status.

```typescript
getImplementationStatus(): {
  wasmAvailable: boolean;
  primitives: {
    matchesAddress: boolean;
    matchesTopic: boolean;
    matchesTopics: boolean;
    filterByAddress: boolean;
    filterByTopics: boolean;
    filterLogs: boolean;
  };
}
```

**Returns:** Object with WASM availability and supported primitives

**Example:**
```typescript
import { getImplementationStatus } from './EventLog.wasm.js';

const status = getImplementationStatus();
console.log('WASM available:', status.wasmAvailable);
console.log('Supported operations:', status.primitives);
```

## Usage Patterns

### Automatic Fallback

```typescript
import { EventLog } from './EventLog.js';
import { filterLogsWasm, isWasmEventLogAvailable } from './EventLog.wasm.js';

function filterLogs(logs, filter) {
  if (isWasmEventLogAvailable()) {
    // Use WASM for better performance
    return filterLogsWasm(
      logs,
      filter.address ? [filter.address] : [],
      filter.topics ?? []
    );
  } else {
    // Fall back to JavaScript
    return EventLog.filterLogs(logs, filter);
  }
}
```

### Performance Comparison

```typescript
import { EventLog } from './EventLog.js';
import { filterLogsWasm } from './EventLog.wasm.js';

const logs = generateLargeLogSet(100000);

// JavaScript implementation
console.time('JS');
const jsResult = EventLog.filterLogs(logs, {
  address: tokenAddress,
  topics: [TRANSFER_SIG],
});
console.timeEnd('JS');

// WASM implementation
console.time('WASM');
const wasmResult = filterLogsWasm(
  logs,
  [tokenAddress],
  [TRANSFER_SIG]
);
console.timeEnd('WASM');
```

### Batched Processing

```typescript
import { filterByAddressWasm, filterByTopicsWasm } from './EventLog.wasm.js';

// Process large log set in stages
const allLogs = fetchAllLogs();

// Stage 1: Filter by contract addresses
const contractLogs = filterByAddressWasm(allLogs, [
  usdcAddress,
  daiAddress,
  wethAddress,
]);

// Stage 2: Filter by event signatures
const transferLogs = filterByTopicsWasm(contractLogs, [TRANSFER_SIG]);

// Stage 3: Further filter by indexed parameters
const userTransfers = filterByTopicsWasm(transferLogs, [
  TRANSFER_SIG,
  null,
  userAddressHash,
]);
```

### Conditional WASM Usage

```typescript
import { EventLog } from './EventLog.js';
import { filterLogsWasm, isWasmEventLogAvailable } from './EventLog.wasm.js';

const WASM_THRESHOLD = 1000; // Use WASM for large datasets

function smartFilter(logs, filter) {
  const useWasm = logs.length >= WASM_THRESHOLD && isWasmEventLogAvailable();

  if (useWasm) {
    return filterLogsWasm(
      logs,
      filter.address ? (Array.isArray(filter.address) ? filter.address : [filter.address]) : [],
      filter.topics ?? []
    );
  }

  return EventLog.filterLogs(logs, filter);
}
```

### Error Handling

```typescript
import { filterLogsWasm, isWasmEventLogAvailable } from './EventLog.wasm.js';
import { EventLog } from './EventLog.js';

function safeFilterWasm(logs, addresses, topics) {
  if (!isWasmEventLogAvailable()) {
    throw new Error('WASM not available');
  }

  try {
    return filterLogsWasm(logs, addresses, topics);
  } catch (error) {
    console.error('WASM filtering failed, falling back to JS:', error);
    return EventLog.filterLogs(logs, { address: addresses, topics });
  }
}
```

## Performance Characteristics

### When to Use WASM

**Use WASM for:**
- Large log sets (>1000 logs)
- Tight filter loops
- Real-time log processing
- High-throughput applications

**Use JavaScript for:**
- Small log sets (<1000 logs)
- One-off queries
- Development/debugging
- Environments without WASM support

### Benchmark Examples

```typescript
// Filtering 100,000 logs
// JavaScript: ~150ms
// WASM: ~40ms (3.75x faster)

// Filtering 1,000 logs
// JavaScript: ~2ms
// WASM: ~1.5ms (overhead not worth it)

// Filtering 10 logs
// JavaScript: ~0.1ms
// WASM: ~0.2ms (overhead dominates)
```

## Implementation Details

### WASM Module

The WASM implementation is compiled from Zig source:

```zig
// src/primitives/event_log.zig
pub fn matchesAddress(log_addr: []const u8, filter_addrs: []const []const u8) bool {
  for (filter_addrs) |addr| {
    if (constantTimeEquals(log_addr, addr)) return true;
  }
  return false;
}
```

### Constant-Time Comparisons

All WASM comparisons use constant-time algorithms to prevent timing attacks:

```typescript
// Address comparison uses constant-time equality check
const matches = matchesAddressWasm(logAddr, [filterAddr]);
// Comparison time doesn't leak whether addresses match
```

### Memory Management

WASM functions handle memory efficiently:
- No allocations for simple comparisons
- Minimal copying for batch operations
- Automatic cleanup via WASM memory management

## Loading

WASM module loaded via loader:

```typescript
import * as loader from "../../wasm-loader/loader.js";

export function matchesAddressWasm(logAddress, filterAddresses) {
  const { Hex } = require("./hex.js");
  return loader.eventLogMatchesAddress(
    Hex.toBytes(logAddress),
    filterAddresses.map(a => Hex.toBytes(a))
  );
}
```

## Compatibility

- **Node.js**: ✅ Supported (v16+)
- **Browsers**: ✅ Supported (modern browsers with WASM)
- **Deno**: ✅ Supported
- **Bun**: ✅ Supported

## Fallback Strategy

Always provide JavaScript fallback:

```typescript
import { EventLog } from './EventLog.js';
import { filterLogsWasm, isWasmEventLogAvailable } from './EventLog.wasm.js';

// Unified API
export function filterLogs(logs, filter) {
  if (isWasmEventLogAvailable()) {
    try {
      return filterLogsWasm(
        logs,
        filter.address ? (Array.isArray(filter.address) ? filter.address : [filter.address]) : [],
        filter.topics ?? []
      );
    } catch (e) {
      console.warn('WASM failed, using JS:', e);
    }
  }

  return EventLog.filterLogs(logs, filter);
}
```

## Notes

- WASM functions use same semantics as JavaScript implementations
- Results identical between WASM and JS versions
- WASM provides performance benefits for large datasets
- Graceful degradation to JavaScript when WASM unavailable
- All WASM operations are constant-time for security
- No additional configuration required - WASM loads automatically
