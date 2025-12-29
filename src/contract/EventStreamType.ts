/**
 * EventStream Type Definitions
 *
 * Types for robust event streaming with dynamic chunking and retry logic.
 *
 * @module contract/EventStreamType
 */

import type { EventType, EncodeTopicsArgs } from "../primitives/Abi/event/EventType.js";
import type { AddressType } from "../primitives/Address/AddressType.js";
import type { TypedProvider } from "../provider/TypedProvider.js";
import type { DecodedEventLog } from "./ContractType.js";

// ============================================================================
// Options Types
// ============================================================================

/**
 * Retry configuration for RPC calls
 */
export interface RetryOptions {
	/** Maximum number of retry attempts. Default: 3 */
	maxRetries?: number;
	/** Initial delay between retries in ms. Default: 1000 */
	initialDelay?: number;
	/** Maximum delay between retries in ms. Default: 30000 */
	maxDelay?: number;
}

/**
 * Base options for EventStream operations
 */
export interface EventStreamOptions {
	/** Initial chunk size in blocks. Default: 500 */
	chunkSize?: number;
	/** Minimum chunk size after reduction. Default: 10 */
	minChunkSize?: number;
	/** Polling interval for watch mode in ms. Default: 2000 */
	pollingInterval?: number;
	/** AbortSignal for cancellation */
	signal?: AbortSignal;
	/** Retry configuration */
	retry?: RetryOptions;
}

/**
 * Options for backfill operation
 */
export interface BackfillOptions extends EventStreamOptions {
	/** Start block (inclusive, required) */
	fromBlock: bigint;
	/** End block (inclusive, required) */
	toBlock: bigint;
}

/**
 * Options for watch operation
 */
export interface WatchOptions extends EventStreamOptions {
	/** Start watching from this block. Default: current block */
	fromBlock?: bigint;
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Metadata included with each event result
 */
export interface EventStreamMetadata {
	/** Current block height at time of fetch */
	currentBlock: bigint;
	/** Start block of the range being fetched */
	fromBlock: bigint;
	/** End block of the range being fetched */
	toBlock: bigint;
}

/**
 * Result yielded by EventStream async generators
 */
export interface EventStreamResult<TEvent extends EventType> {
	/** Decoded event log with typed args */
	log: DecodedEventLog<TEvent>;
	/** Block context metadata */
	metadata: EventStreamMetadata;
}

// ============================================================================
// EventStream Types
// ============================================================================

/**
 * EventStream instance - provides backfill and watch methods
 */
export interface EventStream<TEvent extends EventType> {
	/**
	 * Backfill historical events within a block range
	 *
	 * Uses dynamic chunking to handle large ranges:
	 * - Starts with configured chunk size (default 500)
	 * - Reduces on "block range too large" errors
	 * - Increases after consecutive successes
	 *
	 * @param options - Backfill options including fromBlock and toBlock
	 * @yields EventStreamResult with decoded log and metadata
	 *
	 * @example
	 * ```typescript
	 * for await (const { log, metadata } of stream.backfill({
	 *   fromBlock: 18000000n,
	 *   toBlock: 19000000n
	 * })) {
	 *   console.log(`Block ${metadata.currentBlock}: ${log.args.value}`);
	 * }
	 * ```
	 */
	backfill(options: BackfillOptions): AsyncGenerator<EventStreamResult<TEvent>>;

	/**
	 * Watch for new events by polling
	 *
	 * Continuously polls for new blocks and fetches matching events.
	 * Use AbortSignal to stop watching.
	 *
	 * @param options - Watch options including optional fromBlock
	 * @yields EventStreamResult with decoded log and metadata
	 *
	 * @example
	 * ```typescript
	 * const controller = new AbortController();
	 * for await (const { log } of stream.watch({
	 *   signal: controller.signal
	 * })) {
	 *   console.log('New event:', log.eventName);
	 *   if (shouldStop) controller.abort();
	 * }
	 * ```
	 */
	watch(options?: WatchOptions): AsyncGenerator<EventStreamResult<TEvent>>;
}

// ============================================================================
// Constructor Types
// ============================================================================

/**
 * Options for creating an EventStream
 */
export interface EventStreamConstructorOptions<TEvent extends EventType> {
	/** EIP-1193 provider */
	provider: TypedProvider;
	/** Contract address */
	address: AddressType | `0x${string}`;
	/** Event definition from ABI */
	event: TEvent;
	/** Optional topic filter for indexed parameters */
	filter?: EncodeTopicsArgs<TEvent["inputs"]>;
}

/**
 * EventStream factory function type
 */
export type EventStreamFactory = <TEvent extends EventType>(
	options: EventStreamConstructorOptions<TEvent>,
) => EventStream<TEvent>;
