/**
 * EventStream Factory
 *
 * Creates EventStream instances for robust event streaming with dynamic chunking,
 * retry logic, and block height context.
 *
 * @module contract/EventStream
 */
import * as Event from "../primitives/Abi/event/index.js";
import { Address } from "../primitives/Address/index.js";
import * as BlockNumber from "../primitives/BlockNumber/index.js";
import * as Hash from "../primitives/Hash/index.js";
import * as Hex from "../primitives/Hex/index.js";
import * as TransactionHash from "../primitives/TransactionHash/index.js";
import { backfillEvents } from "./backfillEvents.js";
import { watchEvents } from "./watchEvents.js";
/**
 * @template {import('../primitives/Abi/event/EventType.js').EventType} TEvent
 * @typedef {import('./EventStreamType.js').EventStreamConstructorOptions<TEvent>} EventStreamConstructorOptions
 */
/**
 * @template {import('../primitives/Abi/event/EventType.js').EventType} TEvent
 * @typedef {import('./EventStreamType.js').EventStream<TEvent>} EventStreamInstance
 */
/**
 * @typedef {import('./EventStreamType.js').BackfillOptions} BackfillOptions
 * @typedef {import('./EventStreamType.js').WatchOptions} WatchOptions
 */
/**
 * Create an EventStream for streaming contract events.
 *
 * EventStream provides robust event streaming with:
 * - **Dynamic chunking**: Automatically adjusts chunk size based on RPC limits
 * - **Retry logic**: Exponential backoff for transient errors
 * - **Deduplication**: Tracks seen logs to avoid duplicates
 * - **AbortSignal**: Clean cancellation support
 *
 * @template {import('../primitives/Abi/event/EventType.js').EventType} TEvent
 * @param {import('./EventStreamType.js').EventStreamConstructorOptions<TEvent>} options
 * @returns {import('./EventStreamType.js').EventStream<TEvent>}
 *
 * @example
 * ```typescript
 * import { EventStream } from '@voltaire/contract';
 *
 * const stream = EventStream({
 *   provider,
 *   address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *   event: transferEvent,
 *   filter: { from: userAddress }
 * });
 *
 * // Backfill historical events
 * for await (const { log, metadata } of stream.backfill({
 *   fromBlock: 18000000n,
 *   toBlock: 19000000n
 * })) {
 *   console.log(log.args);
 * }
 *
 * // Watch for new events
 * const controller = new AbortController();
 * for await (const { log } of stream.watch({ signal: controller.signal })) {
 *   console.log('New event:', log);
 * }
 * ```
 */
export function EventStream(options) {
    const { provider, event, filter } = options;
    const address = Address.from(options.address);
    const addressHex = Hex.fromBytes(address);
    // Encode topics from filter
    const topics = Event.encodeTopics(event, filter || {});
    const topicsHex = topics.map((t) => (t === null ? null : Hex.fromBytes(t)));
    /**
     * Decode raw log into structured event
     * @param {*} log
     * @returns {import('./EventStreamType.js').DecodedEventLog<TEvent>}
     */
    function decodeLog(log) {
        const dataBytes = Hex.toBytes(log.data);
        const topicBytes = log.topics.map((/** @type {string} */ t) => Hex.toBytes(t));
        const args = Event.decodeLog(event, dataBytes, 
        /** @type {*} */ (topicBytes));
        return {
            eventName: event.name,
            args: /** @type {*} */ (args),
            blockNumber: BlockNumber.from(BigInt(log.blockNumber)),
            blockHash: Hash.fromHex(log.blockHash),
            transactionHash: TransactionHash.fromHex(log.transactionHash),
            logIndex: Number.parseInt(log.logIndex, 16),
        };
    }
    /**
     * Create unique key for log deduplication
     * @param {*} log
     * @returns {string}
     */
    function getLogKey(log) {
        return `${log.blockNumber}:${log.logIndex}`;
    }
    // Shared context for helper functions
    const context = {
        provider,
        addressHex,
        topicsHex,
        decodeLog,
        getLogKey,
    };
    /**
     * Backfill historical events within a block range.
     *
     * Uses dynamic chunking to handle large ranges efficiently.
     *
     * @param {BackfillOptions} backfillOptions
     * @returns {AsyncGenerator<import('./EventStreamType.js').EventStreamResult<TEvent>>}
     */
    function backfill(backfillOptions) {
        return backfillEvents(context, backfillOptions);
    }
    /**
     * Watch for new events by polling.
     *
     * Continuously polls for new blocks and fetches matching events.
     *
     * @param {WatchOptions} [watchOptions]
     * @returns {AsyncGenerator<import('./EventStreamType.js').EventStreamResult<TEvent>>}
     */
    function watch(watchOptions) {
        return watchEvents(context, watchOptions);
    }
    return /** @type {import('./EventStreamType.js').EventStream<TEvent>} */ ({
        backfill,
        watch,
    });
}
