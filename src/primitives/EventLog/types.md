---
title: "EventLog Types"
---

# EventLog Types

TypeScript type definitions for EventLog and Filter.

## BrandedEventLog

Branded type representing an Ethereum event log.

```typescript
type BrandedEventLog<
  TAddress extends BrandedAddress = BrandedAddress,
  TTopics extends readonly BrandedHash[] = readonly BrandedHash[],
> = {
  /** Contract address that emitted the log */
  address: TAddress;
  /** Event topics (topic0 = event signature, topic1-3 = indexed parameters) */
  topics: TTopics;
  /** Event data (non-indexed parameters) */
  data: Uint8Array;
  /** Block number where log was emitted */
  blockNumber?: bigint;
  /** Transaction hash that generated the log */
  transactionHash?: BrandedHash;
  /** Transaction index in block */
  transactionIndex?: number;
  /** Block hash */
  blockHash?: BrandedHash;
  /** Log index in block */
  logIndex?: number;
  /** Log removed due to chain reorganization */
  removed?: boolean;
} & { readonly __tag: "EventLog" };
```

**Type Parameters:**
- `TAddress`: Address type (defaults to BrandedAddress)
- `TTopics`: Topics array type (defaults to readonly BrandedHash[])

**Fields:**

### Required Fields

**address**: `BrandedAddress`
- Contract address that emitted the log
- 20-byte Ethereum address
- Must be valid BrandedAddress instance

**topics**: `readonly BrandedHash[]`
- Array of 32-byte topic hashes
- topic[0]: Event signature hash (for non-anonymous events)
- topic[1-3]: Indexed event parameters
- Maximum 4 topics (1 signature + 3 indexed params)
- Can be empty array for anonymous events without indexed params

**data**: `Uint8Array`
- Non-indexed event parameters
- ABI-encoded byte array
- Can be empty for events with only indexed parameters

### Optional Fields

**blockNumber**: `bigint | undefined`
- Block number where log was emitted
- Unsigned 256-bit integer
- Undefined for pending transactions

**transactionHash**: `BrandedHash | undefined`
- Hash of transaction that generated the log
- 32-byte hash
- Undefined for pending transactions

**transactionIndex**: `number | undefined`
- Index of transaction within block
- Zero-based integer
- Undefined for pending transactions

**blockHash**: `BrandedHash | undefined`
- Hash of block containing the log
- 32-byte hash
- Undefined for pending transactions

**logIndex**: `number | undefined`
- Index of log within block
- Zero-based integer
- Used for ordering logs within same block
- Undefined for pending transactions

**removed**: `boolean | undefined`
- Whether log was removed due to chain reorganization
- `true` if log invalidated by reorg
- `false` or `undefined` if log still valid
- Defaults to `false` when creating logs

### Brand Tag

**__tag**: `"EventLog"`
- Readonly brand tag for type safety
- Distinguishes EventLog from other objects
- Not directly accessed in application code

## Filter

Type for filtering event logs.

```typescript
type Filter<
  TAddress extends BrandedAddress | BrandedAddress[] | undefined =
    | BrandedAddress
    | BrandedAddress[]
    | undefined,
  TTopics extends readonly (BrandedHash | BrandedHash[] | null)[] | undefined =
    | readonly (BrandedHash | BrandedHash[] | null)[]
    | undefined,
> = {
  /** Contract address(es) to filter by */
  address?: TAddress;
  /** Topic filters (null entries match any topic, arrays match any of the hashes) */
  topics?: TTopics;
  /** Starting block number */
  fromBlock?: bigint;
  /** Ending block number */
  toBlock?: bigint;
  /** Block hash to filter by (alternative to fromBlock/toBlock) */
  blockHash?: BrandedHash;
};
```

**Type Parameters:**
- `TAddress`: Address filter type (single address, array, or undefined)
- `TTopics`: Topics filter type (topic patterns or undefined)

**Fields:**

**address**: `BrandedAddress | BrandedAddress[] | undefined`
- Single address: Matches exact address
- Array of addresses: Matches any address (OR logic)
- Undefined: Matches all addresses

**topics**: `readonly (BrandedHash | BrandedHash[] | null)[] | undefined`
- Array of topic filters corresponding to log topic positions
- `null` element: Matches any topic at that position
- Single hash: Matches exact hash at that position
- Array of hashes: Matches any hash at that position (OR logic)
- Undefined: No topic filtering
- Empty array: Matches all logs

**fromBlock**: `bigint | undefined`
- Starting block number (inclusive)
- Only matches logs with blockNumber >= fromBlock
- Undefined: No lower bound

**toBlock**: `bigint | undefined`
- Ending block number (inclusive)
- Only matches logs with blockNumber <= toBlock
- Undefined: No upper bound

**blockHash**: `BrandedHash | undefined`
- Specific block hash to match
- Alternative to fromBlock/toBlock range
- Only matches logs with exact blockHash
- Undefined: No block hash filtering

## EventLogParams

Input parameters for creating event logs.

```typescript
interface EventLogParams {
  address: BrandedAddress;
  topics: readonly (BrandedHash | null | undefined)[];
  data: BrandedHex;
  blockNumber?: bigint;
  blockHash?: BrandedHash;
  transactionHash?: BrandedHash;
  transactionIndex?: number;
  logIndex?: number;
  removed?: boolean;
}
```

Used by EventLog constructor, from(), and create().

## Type Usage Examples

### Basic EventLog

```typescript
import type { BrandedEventLog } from './EventLog.js';

const log: BrandedEventLog = EventLog({
  address: Address.fromHex('0x...'),
  topics: [Hash.fromHex('0x...')],
  data: new Uint8Array([]),
});
```

### Type-Safe Topic Access

```typescript
// Transfer event with known topic structure
type TransferLog = BrandedEventLog<
  BrandedAddress,
  readonly [BrandedHash, BrandedHash, BrandedHash] // signature, from, to
>;

function decodeTransfer(log: TransferLog) {
  const [signature, fromHash, toHash] = log.topics; // type-safe destructuring
  // ...
}
```

### Filter Types

```typescript
import type { Filter } from './EventLog.js';

// Single address filter
const filter1: Filter<BrandedAddress> = {
  address: tokenAddress,
  topics: [TRANSFER_SIG],
};

// Multiple addresses filter
const filter2: Filter<BrandedAddress[]> = {
  address: [usdc, dai, weth],
  topics: [TRANSFER_SIG, null, userHash],
};

// No address filter
const filter3: Filter<undefined> = {
  topics: [TRANSFER_SIG],
  fromBlock: 18000000n,
  toBlock: 18500000n,
};
```

### Generic Functions

```typescript
// Generic over address type
function filterByAddress<TAddr extends BrandedAddress>(
  logs: BrandedEventLog[],
  address: TAddr
): BrandedEventLog<TAddr>[] {
  return logs.filter(log =>
    log.matchesAddress(address)
  ) as BrandedEventLog<TAddr>[];
}

// Generic over topic structure
function getLogsWith3Topics(
  logs: BrandedEventLog[]
): BrandedEventLog<BrandedAddress, readonly [BrandedHash, BrandedHash, BrandedHash]>[] {
  return logs.filter(log =>
    log.topics.length === 3
  ) as any;
}
```

### Type Guards

```typescript
function isEventLog(value: unknown): value is BrandedEventLog {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__tag' in value &&
    (value as any).__tag === 'EventLog'
  );
}

function hasBlockNumber(log: BrandedEventLog): log is BrandedEventLog & {
  blockNumber: bigint
} {
  return log.blockNumber !== undefined;
}

// Usage
const logs: BrandedEventLog[] = [...];
const minedLogs = logs.filter(hasBlockNumber);
// minedLogs has type BrandedEventLog & { blockNumber: bigint }
```

### Partial Logs

```typescript
// Log without optional fields
type MinimalLog = Pick<BrandedEventLog, 'address' | 'topics' | 'data' | '__tag'>;

// Log with all metadata
type CompleteLog = Required<BrandedEventLog>;

function requireCompleteLog(log: BrandedEventLog): asserts log is CompleteLog {
  if (
    log.blockNumber === undefined ||
    log.transactionHash === undefined ||
    log.logIndex === undefined
  ) {
    throw new Error('Incomplete log');
  }
}
```

### Filter Builders

```typescript
// Type-safe filter builder
class FilterBuilder {
  private filter: Filter = {};

  forAddress(addr: BrandedAddress | BrandedAddress[]): this {
    this.filter.address = addr;
    return this;
  }

  withTopics(topics: readonly (BrandedHash | BrandedHash[] | null)[]): this {
    this.filter.topics = topics;
    return this;
  }

  fromBlock(block: bigint): this {
    this.filter.fromBlock = block;
    return this;
  }

  toBlock(block: bigint): this {
    this.filter.toBlock = block;
    return this;
  }

  build(): Filter {
    return this.filter;
  }
}

// Usage
const filter = new FilterBuilder()
  .forAddress(tokenAddress)
  .withTopics([TRANSFER_SIG, null, userHash])
  .fromBlock(18000000n)
  .build();
```

## Type Branding

EventLog uses TypeScript branded types for type safety:

```typescript
// Brand prevents accidental mixing of types
const log: BrandedEventLog = {
  __tag: "EventLog", // Brand tag
  address: Address.fromHex('0x...'),
  topics: [],
  data: new Uint8Array([]),
};

// This won't compile (missing brand)
const notLog = {
  address: Address.fromHex('0x...'),
  topics: [],
  data: new Uint8Array([]),
};
// Type error: notLog is not assignable to BrandedEventLog
```

## Related Types

```typescript
// Re-exported from other modules
import type { BrandedAddress } from '../Address/BrandedAddress/BrandedAddress.js';
import type { BrandedHash } from '../Hash/BrandedHash/BrandedHash.js';
import type { BrandedHex } from '../Hex/BrandedHex/BrandedHex.js';
```

## Type Aliases

```typescript
// For backwards compatibility
export type { BrandedEventLog as Data } from './BrandedEventLog.js';

// Usage
import type { Data } from './EventLog.js';
const log: Data = EventLog({ /* ... */ });
```
