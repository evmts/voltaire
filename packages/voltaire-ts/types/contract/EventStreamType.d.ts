/**
 * EventStream Type Definitions
 *
 * Types for robust event streaming with dynamic chunking and retry logic.
 *
 * @module contract/EventStreamType
 */
import type { EncodeTopicsArgs, EventType } from "../primitives/Abi/event/EventType.js";
import type { ParametersToObject } from "../primitives/Abi/Parameter.js";
import type { AddressType } from "../primitives/Address/AddressType.js";
import type { BlockNumberType } from "../primitives/BlockNumber/BlockNumberType.js";
import type { HashType } from "../primitives/Hash/HashType.js";
import type { TransactionHashType } from "../primitives/TransactionHash/TransactionHashType.js";
import type { TypedProvider } from "../provider/TypedProvider.js";
/**
 * Decoded event log with typed args from ABI
 */
export type DecodedEventLog<TEvent extends EventType> = {
    /** Event name */
    eventName: TEvent["name"];
    /** Decoded event arguments (typed from ABI) */
    args: ParametersToObject<TEvent["inputs"]>;
    /** Block number where event was emitted */
    blockNumber: BlockNumberType;
    /** Block hash */
    blockHash: HashType;
    /** Transaction hash */
    transactionHash: TransactionHashType;
    /** Log index within the block */
    logIndex: number;
};
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
    /** Initial chunk size in blocks. Default: 100 */
    chunkSize?: number;
    /** Minimum chunk size after reduction. Default: 10 */
    minChunkSize?: number;
    /** Polling interval for watch mode in ms. Default: 1000 */
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
/**
 * Metadata included with each event result
 */
export interface EventStreamMetadata {
    /** Current chain head block number */
    chainHead: bigint;
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
export type EventStreamFactory = <TEvent extends EventType>(options: EventStreamConstructorOptions<TEvent>) => EventStream<TEvent>;
//# sourceMappingURL=EventStreamType.d.ts.map