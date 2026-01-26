/**
 * @fileoverview BlockStream service definition for Effect-native block streaming.
 *
 * @module BlockStreamService
 * @since 0.2.12
 *
 * @description
 * Provides Effect Stream integration for watching blocks with reorg support.
 * Wraps voltaire core's BlockStream for fiber-safe, composable block streaming.
 *
 * @see {@link BlockStream} - The live implementation layer
 * @see {@link TransportService} - Required dependency
 */

import type {
	BackfillOptions,
	BlockInclude,
	BlockStreamEvent,
	BlocksEvent,
	WatchOptions,
} from "@tevm/voltaire/block";
import * as Context from "effect/Context";
import type * as Stream from "effect/Stream";
import type { BlockStreamError } from "./BlockStreamError.js";

/**
 * Shape of the BlockStream service.
 *
 * @since 0.2.12
 */
export type BlockStreamShape = {
	/**
	 * Backfill historical blocks within a range.
	 *
	 * @example
	 * ```typescript
	 * const program = Effect.gen(function* () {
	 *   const stream = yield* BlockStreamService;
	 *   yield* Stream.runForEach(
	 *     stream.backfill({ fromBlock: 18000000n, toBlock: 18000100n }),
	 *     (event) => Effect.log(`Got ${event.blocks.length} blocks`)
	 *   );
	 * });
	 * ```
	 */
	readonly backfill: <TInclude extends BlockInclude = "header">(
		options: BackfillOptions<TInclude>,
	) => Stream.Stream<BlocksEvent<TInclude>, BlockStreamError>;

	/**
	 * Watch for new blocks with reorg detection.
	 *
	 * @example
	 * ```typescript
	 * const program = Effect.gen(function* () {
	 *   const stream = yield* BlockStreamService;
	 *   yield* Stream.runForEach(
	 *     stream.watch({ include: 'transactions' }),
	 *     (event) => {
	 *       if (event.type === 'reorg') {
	 *         return Effect.log(`Reorg: ${event.removed.length} blocks removed`);
	 *       }
	 *       return Effect.log(`New block: ${event.blocks[0]?.header.number}`);
	 *     }
	 *   );
	 * });
	 * ```
	 */
	readonly watch: <TInclude extends BlockInclude = "header">(
		options?: WatchOptions<TInclude>,
	) => Stream.Stream<BlockStreamEvent<TInclude>, BlockStreamError>;
};

/**
 * BlockStream service for Effect-native block streaming.
 *
 * @since 0.2.12
 *
 * @example
 * ```typescript
 * import { Effect, Stream } from 'effect';
 * import { BlockStreamService, BlockStream, HttpTransport } from 'voltaire-effect/services';
 *
 * const program = Effect.gen(function* () {
 *   const blockStream = yield* BlockStreamService;
 *
 *   yield* Stream.runForEach(
 *     blockStream.watch({ include: 'receipts' }),
 *     (event) => {
 *       if (event.type === 'reorg') {
 *         return Effect.log(`Reorg detected`);
 *       }
 *       return Effect.log(`Block ${event.blocks[0]?.header.number}`);
 *     }
 *   );
 * }).pipe(
 *   Effect.provide(BlockStream),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * );
 * ```
 */
export class BlockStreamService extends Context.Tag("BlockStreamService")<
	BlockStreamService,
	BlockStreamShape
>() {}
