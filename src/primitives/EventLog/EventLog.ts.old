/**
 * EventLog Types and Utilities
 *
 * Ethereum event log structure with filtering and matching operations.
 *
 * @example
 * ```typescript
 * import * as EventLog from './EventLog.js';
 *
 * // Types
 * const log: EventLog.EventLog = { ... };
 *
 * // Operations
 * const matches = EventLog.matches.call(log, filterTopics);
 * const topic0 = EventLog.getTopic0(log);
 * ```
 */

import type { Address } from "../Address/index.js";
import type { Hash } from "../Hash/index.js";

// ============================================================================
// Core Types
// ============================================================================

/**
 * Ethereum event log structure with generic tracking
 */
export type Data<
  TAddress extends Address = Address,
  TTopics extends readonly Hash[] = readonly Hash[],
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
  transactionHash?: Hash;
  /** Transaction index in block */
  transactionIndex?: number;
  /** Block hash */
  blockHash?: Hash;
  /** Log index in block */
  logIndex?: number;
  /** Log removed due to chain reorganization */
  removed?: boolean;
};

/**
 * Event log filter for querying logs
 */
export type Filter<
  TAddress extends Address | Address[] | undefined = Address | Address[] | undefined,
  TTopics extends readonly (Hash | Hash[] | null)[] | undefined = readonly (Hash | Hash[] | null)[] | undefined,
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
  blockHash?: Hash;
};

// ============================================================================
// EventLog Operations
// ============================================================================

/**
 * Create event log (standard form)
 *
 * @param params Event log parameters
 * @returns EventLog object
 *
 * @example
 * ```typescript
 * const log = EventLog.create({
 *   address: "0x..." as Address,
 *   topics: [topic0, topic1],
 *   data: new Uint8Array([...]),
 * });
 * ```
 */
export function create<
  TAddress extends Address = Address,
  TTopics extends readonly Hash[] = readonly Hash[],
>(params: {
  address: TAddress;
  topics: TTopics;
  data: Uint8Array;
  blockNumber?: bigint;
  transactionHash?: Hash;
  transactionIndex?: number;
  blockHash?: Hash;
  logIndex?: number;
  removed?: boolean;
}): Data<TAddress, TTopics> {
  const result: Data<TAddress, TTopics> = {
    address: params.address,
    topics: params.topics,
    data: params.data,
    removed: params.removed ?? false,
  };
  if (params.blockNumber !== undefined) {
    result.blockNumber = params.blockNumber;
  }
  if (params.transactionHash !== undefined) {
    result.transactionHash = params.transactionHash;
  }
  if (params.transactionIndex !== undefined) {
    result.transactionIndex = params.transactionIndex;
  }
  if (params.blockHash !== undefined) {
    result.blockHash = params.blockHash;
  }
  if (params.logIndex !== undefined) {
    result.logIndex = params.logIndex;
  }
  return result;
}

/**
 * Get topic0 (event signature) from log (standard form)
 *
 * @param log Event log
 * @returns Topic0 hash or undefined
 *
 * @example
 * ```typescript
 * const topic0 = EventLog.getTopic0(log);
 * ```
 */
export function getTopic0<T extends Data>(log: T): Hash | undefined {
  return log.topics[0];
}

/**
 * Get topic0 (event signature) from log (convenience form with this:)
 *
 * @example
 * ```typescript
 * const topic0 = EventLog.getSignature.call(log);
 * ```
 */
export function getSignature<T extends Data>(this: T): Hash | undefined {
  return getTopic0(this);
}

/**
 * Get indexed topics (excluding topic0) (standard form)
 *
 * @param log Event log
 * @returns Array of indexed topic hashes
 *
 * @example
 * ```typescript
 * const indexed = EventLog.getIndexedTopics(log); // [topic1, topic2, topic3]
 * ```
 */
export function getIndexedTopics<T extends Data>(log: T): readonly Hash[] {
  return log.topics.slice(1);
}

/**
 * Get indexed topics (excluding topic0) (convenience form with this:)
 *
 * @example
 * ```typescript
 * const indexed = EventLog.getIndexed.call(log);
 * ```
 */
export function getIndexed<T extends Data>(this: T): readonly Hash[] {
  return getIndexedTopics(this);
}

/**
 * Check if log matches topic filter (standard form)
 *
 * Topic filter rules:
 * - null entries match any topic
 * - Hash entries must match exactly
 * - Hash[] entries match if log topic equals any hash in array
 *
 * @param log Event log to check
 * @param filterTopics Topic filter
 * @returns true if log matches filter
 *
 * @example
 * ```typescript
 * const matches = EventLog.matchesTopics(log, [topic0, null, topic2]);
 * ```
 */
export function matchesTopics<T extends Data>(
  log: T,
  filterTopics: readonly (Hash | Hash[] | null)[],
): boolean {
  for (let i = 0; i < filterTopics.length; i++) {
    const filterTopic = filterTopics[i];
    if (filterTopic === null) {
      continue;
    }

    if (i >= log.topics.length) {
      return false;
    }

    const logTopic = log.topics[i]!; // Safe: checked bounds above

    // Handle array of possible topics
    if (Array.isArray(filterTopic)) {
      let anyMatch = false;
      for (const possibleTopic of filterTopic as Hash[]) {
        if (hashEquals(logTopic, possibleTopic)) {
          anyMatch = true;
          break;
        }
      }
      if (!anyMatch) {
        return false;
      }
    } else {
      // Single topic - must match exactly
      if (!hashEquals(logTopic, filterTopic as Hash)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Check if log matches topic filter (convenience form with this:)
 *
 * @example
 * ```typescript
 * const matches = EventLog.matches.call(log, [topic0, null, topic2]);
 * ```
 */
export function matches<T extends Data>(
  this: T,
  filterTopics: readonly (Hash | Hash[] | null)[],
): boolean {
  return matchesTopics(this, filterTopics);
}

/**
 * Check if log matches address filter (standard form)
 *
 * @param log Event log to check
 * @param filterAddress Address or array of addresses
 * @returns true if log matches address filter
 *
 * @example
 * ```typescript
 * const matches = EventLog.matchesAddress(log, "0x..." as Address);
 * const matchesAny = EventLog.matchesAddress(log, [addr1, addr2]);
 * ```
 */
export function matchesAddress<T extends Data>(
  log: T,
  filterAddress: Address | Address[],
): boolean {
  if (Array.isArray(filterAddress)) {
    return filterAddress.some((addr) => addressEquals(log.address, addr));
  }
  return addressEquals(log.address, filterAddress);
}

/**
 * Check if log matches address filter (convenience form with this:)
 *
 * @example
 * ```typescript
 * const matches = EventLog.matchesAddr.call(log, "0x..." as Address);
 * ```
 */
export function matchesAddr<T extends Data>(
  this: T,
  filterAddress: Address | Address[],
): boolean {
  return matchesAddress(this, filterAddress);
}

/**
 * Check if log matches complete filter (standard form)
 *
 * @param log Event log to check
 * @param filter Complete filter object
 * @returns true if log matches all filter criteria
 *
 * @example
 * ```typescript
 * const matches = EventLog.matchesFilter(log, {
 *   address: "0x..." as Address,
 *   topics: [topic0, null, topic2],
 *   fromBlock: 100n,
 *   toBlock: 200n,
 * });
 * ```
 */
export function matchesFilter<T extends Data>(
  log: T,
  filter: Filter,
): boolean {
  // Check address filter
  if (filter.address !== undefined) {
    if (!matchesAddress(log, filter.address)) {
      return false;
    }
  }

  // Check topics filter
  if (filter.topics !== undefined) {
    if (!matchesTopics(log, filter.topics)) {
      return false;
    }
  }

  // Check block number range
  if (log.blockNumber !== undefined) {
    if (filter.fromBlock !== undefined && log.blockNumber < filter.fromBlock) {
      return false;
    }
    if (filter.toBlock !== undefined && log.blockNumber > filter.toBlock) {
      return false;
    }
  }

  // Check block hash
  if (filter.blockHash !== undefined && log.blockHash !== undefined) {
    if (!hashEquals(log.blockHash, filter.blockHash)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if log matches complete filter (convenience form with this:)
 *
 * @example
 * ```typescript
 * const matches = EventLog.matchesAll.call(log, filter);
 * ```
 */
export function matchesAll<T extends Data>(
  this: T,
  filter: Filter,
): boolean {
  return matchesFilter(this, filter);
}

/**
 * Filter array of logs by filter criteria (standard form)
 *
 * @param logs Array of event logs
 * @param filter Filter criteria
 * @returns Filtered array of logs
 *
 * @example
 * ```typescript
 * const filtered = EventLog.filterLogs(logs, {
 *   address: "0x..." as Address,
 *   topics: [topic0],
 * });
 * ```
 */
export function filterLogs<T extends Data>(
  logs: readonly T[],
  filter: Filter,
): T[] {
  return logs.filter((log) => matchesFilter(log, filter));
}

/**
 * Filter array of logs by filter criteria (convenience form with this:)
 *
 * @example
 * ```typescript
 * const filtered = EventLog.filter.call(logs, filter);
 * ```
 */
export function filter<T extends Data>(
  this: readonly T[],
  filter: Filter,
): T[] {
  return filterLogs(this, filter);
}

/**
 * Sort logs by block number and log index (standard form)
 *
 * @param logs Array of event logs
 * @returns Sorted array (ascending order)
 *
 * @example
 * ```typescript
 * const sorted = EventLog.sortLogs(logs);
 * ```
 */
export function sortLogs<T extends Data>(logs: readonly T[]): T[] {
  return [...logs].sort((a, b) => {
    // Sort by block number first
    const blockA = a.blockNumber ?? 0n;
    const blockB = b.blockNumber ?? 0n;
    if (blockA !== blockB) {
      return blockA < blockB ? -1 : 1;
    }

    // Then by log index
    const indexA = a.logIndex ?? 0;
    const indexB = b.logIndex ?? 0;
    return indexA - indexB;
  });
}

/**
 * Sort logs by block number and log index (convenience form with this:)
 *
 * @example
 * ```typescript
 * const sorted = EventLog.sort.call(logs);
 * ```
 */
export function sort<T extends Data>(this: readonly T[]): T[] {
  return sortLogs(this);
}

/**
 * Check if log was removed due to chain reorganization (standard form)
 *
 * @param log Event log
 * @returns true if log was removed
 *
 * @example
 * ```typescript
 * if (EventLog.isRemoved(log)) {
 *   console.log("Log was removed due to reorg");
 * }
 * ```
 */
export function isRemoved<T extends Data>(log: T): boolean {
  return log.removed === true;
}

/**
 * Check if log was removed due to chain reorganization (convenience form with this:)
 *
 * @example
 * ```typescript
 * if (EventLog.wasRemoved.call(log)) {
 *   console.log("Log was removed");
 * }
 * ```
 */
export function wasRemoved<T extends Data>(this: T): boolean {
  return isRemoved(this);
}

/**
 * Clone event log (standard form)
 *
 * @param log Event log to clone
 * @returns New event log with same data
 *
 * @example
 * ```typescript
 * const cloned = EventLog.clone(log);
 * ```
 */
export function clone<T extends Data>(log: T): T {
  return {
    ...log,
    topics: [...log.topics],
    data: new Uint8Array(log.data),
  } as T;
}

/**
 * Clone event log (convenience form with this:)
 *
 * @example
 * ```typescript
 * const cloned = EventLog.copy.call(log);
 * ```
 */
export function copy<T extends Data>(this: T): T {
  return clone(this);
}

// ============================================================================
// Helper Functions (internal)
// ============================================================================

/**
 * Compare two hashes for equality
 */
function hashEquals(a: Hash, b: Hash): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Compare two addresses for equality (byte-wise comparison)
 */
function addressEquals(a: Address, b: Address): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

// ============================================================================
// Branded Types
// ============================================================================

/**
 * EventLog branded type alias
 */
export type EventLog = Data;
