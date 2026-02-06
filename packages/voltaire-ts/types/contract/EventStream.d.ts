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
export function EventStream<TEvent extends import("../primitives/Abi/event/EventType.js").EventType>(options: import("./EventStreamType.js").EventStreamConstructorOptions<TEvent>): import("./EventStreamType.js").EventStream<TEvent>;
export type EventStreamConstructorOptions<TEvent extends import("../primitives/Abi/event/EventType.js").EventType> = import("./EventStreamType.js").EventStreamConstructorOptions<TEvent>;
export type EventStreamInstance<TEvent extends import("../primitives/Abi/event/EventType.js").EventType> = import("./EventStreamType.js").EventStream<TEvent>;
export type BackfillOptions = import("./EventStreamType.js").BackfillOptions;
export type WatchOptions = import("./EventStreamType.js").WatchOptions;
//# sourceMappingURL=EventStream.d.ts.map