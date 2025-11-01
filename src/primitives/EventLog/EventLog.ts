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

/**
 * EventLog branded type alias
 */
export type EventLog = Data;

// ============================================================================
// Exports
// ============================================================================

export { create } from "./create.js";
export { matchesTopics, matchesTopics as matches } from "./matchesTopics.js";
export { matchesAddress, matchesAddress as matchesAddr } from "./matchesAddress.js";
export { matchesFilter, matchesFilter as matchesAll } from "./matchesFilter.js";

// Simple getters
export function getTopic0<T extends Data>(log: T): Hash | undefined {
	return log.topics[0];
}

export function getSignature<T extends Data>(this: T): Hash | undefined {
	return getTopic0(this);
}

export function getIndexedTopics<T extends Data>(log: T): readonly Hash[] {
	return log.topics.slice(1);
}

export function getIndexed<T extends Data>(this: T): readonly Hash[] {
	return getIndexedTopics(this);
}

export function filterLogs<T extends Data>(logs: readonly T[], filter: Filter): T[] {
	const { matchesFilter } = require("./matchesFilter.js");
	return logs.filter((log) => matchesFilter(log, filter));
}

export function filter<T extends Data>(this: readonly T[], filter: Filter): T[] {
	return filterLogs(this, filter);
}

export function sortLogs<T extends Data>(logs: readonly T[]): T[] {
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

export function sort<T extends Data>(this: readonly T[]): T[] {
	return sortLogs(this);
}

export function isRemoved<T extends Data>(log: T): boolean {
	return log.removed === true;
}

export function wasRemoved<T extends Data>(this: T): boolean {
	return isRemoved(this);
}

export function clone<T extends Data>(log: T): T {
	return {
		...log,
		topics: [...log.topics],
		data: new Uint8Array(log.data),
	} as T;
}

export function copy<T extends Data>(this: T): T {
	return clone(this);
}
