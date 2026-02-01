/**
 * Block Module
 *
 * BlockStream for streaming blocks over JSON-RPC with reorg support.
 *
 * @example
 * ```typescript
 * import { BlockStream } from '@voltaire/block';
 *
 * const stream = BlockStream({ provider });
 *
 * // Backfill historical blocks
 * for await (const { blocks } of stream.backfill({
 *   fromBlock: 18000000n,
 *   toBlock: 19000000n,
 *   include: 'transactions'
 * })) {
 *   for (const block of blocks) {
 *     console.log(`Block ${block.header.number}`);
 *   }
 * }
 *
 * // Watch for new blocks with reorg handling
 * const controller = new AbortController();
 * for await (const event of stream.watch({
 *   signal: controller.signal,
 *   include: 'receipts'
 * })) {
 *   if (event.type === 'reorg') {
 *     console.log('Reorg:', event.removed.length, 'blocks removed');
 *     for (const block of event.removed) {
 *       rollback(block.hash);
 *     }
 *   } else {
 *     for (const block of event.blocks) {
 *       process(block);
 *     }
 *   }
 * }
 * ```
 *
 * @module block
 */
export { StreamAbortedError } from "../stream/errors.js";
export { BlockStream } from "./BlockStream.js";
export type { BackfillOptions, BlockInclude, BlockStream as BlockStreamInstance, BlockStreamConstructorOptions, BlockStreamEvent, BlockStreamMetadata, BlockStreamOptions, BlocksEvent, LightBlock, ReorgEvent, RetryOptions, StreamBlock, WatchOptions, } from "./BlockStreamType.js";
export { BlockRangeTooLargeError, BlockStreamAbortedError, UnrecoverableReorgError, } from "./errors.js";
//# sourceMappingURL=index.d.ts.map