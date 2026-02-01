/**
 * @fileoverview Free function to backfill historical blocks.
 *
 * @module Provider/functions/backfillBlocks
 * @since 0.4.0
 */

import {
	type BackfillOptions,
	type BlockInclude,
	type BlocksEvent,
	BlockStream as CoreBlockStream,
} from "@tevm/voltaire/block";
import * as Effect from "effect/Effect";
import * as Runtime from "effect/Runtime";
import * as Stream from "effect/Stream";
import { TransportError } from "../../Transport/TransportError.js";
import { ProviderService } from "../ProviderService.js";
import { ProviderStreamError, type BackfillBlocksError } from "../types.js";

/**
 * Backfills historical blocks within a range.
 *
 * Fetches blocks in chunks with dynamic sizing to handle RPC limits.
 * No reorg tracking for backfill (historical blocks are final).
 *
 * @param options - Backfill options including fromBlock and toBlock
 * @returns Stream yielding BlocksEvents with blocks and metadata
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect, Stream } from 'effect'
 * import { backfillBlocks, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = backfillBlocks({
 *   fromBlock: 18000000n,
 *   toBlock: 18001000n,
 *   include: 'transactions'
 * }).pipe(
 *   Stream.tap((event) =>
 *     Effect.sync(() => {
 *       console.log('Backfilled blocks:', event.blocks.length)
 *     })
 *   ),
 *   Stream.runDrain,
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const backfillBlocks = <TInclude extends BlockInclude = "header">(
	options: BackfillOptions<TInclude>,
): Stream.Stream<BlocksEvent<TInclude>, BackfillBlocksError, ProviderService> =>
	Stream.unwrap(
		Effect.gen(function* () {
			const svc = yield* ProviderService;
			const runtime = yield* Effect.runtime<never>();
			const provider = {
				request: async ({
					method,
					params,
				}: {
					method: string;
					params?: unknown[];
				}) =>
					Runtime.runPromise(runtime)(svc.request(method, params)),
				on: () => {},
				removeListener: () => {},
			};
			const coreStream = CoreBlockStream({ provider: provider as any });
			const cleanup = () => {
				(coreStream as unknown as { destroy?: () => void }).destroy?.();
			};
			return Stream.acquireRelease(
				Effect.sync(() => coreStream.backfill(options)),
				() => Effect.sync(cleanup),
			).pipe(
				Stream.flatMap((generator) =>
					Stream.fromAsyncIterable(
						{ [Symbol.asyncIterator]: () => generator },
						(error) =>
							error instanceof TransportError
								? error
								: new ProviderStreamError(
										{ method: "backfillBlocks", options },
										error instanceof Error
											? error.message
											: "BlockStream error",
										{ cause: error instanceof Error ? error : undefined },
									),
					),
				),
			);
		}),
	);
