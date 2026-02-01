/**
 * EventStream Module
 *
 * Robust event streaming primitive with dynamic chunking, retry logic,
 * and block context metadata.
 *
 * @example
 * ```typescript
 * import { EventStream } from '@tevm/voltaire/EventStream';
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
 * for await (const { log } of stream.watch()) {
 *   console.log('New event:', log);
 * }
 * ```
 *
 * @module contract
 */
export { StreamAbortedError } from "../stream/errors.js";
export { EventStream } from "./EventStream.js";
export type { BackfillOptions, DecodedEventLog, EventStream as EventStreamInstance, EventStreamConstructorOptions, EventStreamMetadata, EventStreamOptions, EventStreamResult, RetryOptions, WatchOptions, } from "./EventStreamType.js";
export { BlockRangeTooLargeError, EventStreamAbortedError, } from "./errors.js";
//# sourceMappingURL=index.d.ts.map