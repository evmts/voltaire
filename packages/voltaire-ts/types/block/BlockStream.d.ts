/**
 * Create a BlockStream for streaming blocks with reorg support.
 *
 * BlockStream provides robust block streaming with:
 * - **Dynamic chunking**: Automatically adjusts chunk size based on RPC limits
 * - **Reorg detection**: Tracks parent hash chain to detect reorganizations
 * - **Retry logic**: Exponential backoff for transient errors
 * - **AbortSignal**: Clean cancellation support
 *
 * @param {BlockStreamConstructorOptions} options
 * @returns {BlockStreamInstance}
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
 * for await (const event of stream.watch({ signal: controller.signal })) {
 *   if (event.type === 'reorg') {
 *     console.log('Reorg detected:', event.removed.length, 'blocks removed');
 *   } else {
 *     for (const block of event.blocks) {
 *       console.log('New block:', block.header.number);
 *     }
 *   }
 * }
 * ```
 */
export function BlockStream(options: BlockStreamConstructorOptions): BlockStreamInstance;
export type BlockStreamConstructorOptions = import("./BlockStreamType.js").BlockStreamConstructorOptions;
export type BlockStreamInstance = import("./BlockStreamType.js").BlockStream;
export type LightBlock = import("./BlockStreamType.js").LightBlock;
export type BlockInclude = import("./BlockStreamType.js").BlockInclude;
//# sourceMappingURL=BlockStream.d.ts.map