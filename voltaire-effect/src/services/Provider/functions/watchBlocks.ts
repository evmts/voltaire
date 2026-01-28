/**
 * @fileoverview Free function to watch for new blocks with reorg detection.
 *
 * @module Provider/functions/watchBlocks
 * @since 0.4.0
 */

import {
	type BlockInclude,
	type BlockStreamEvent,
	BlockStream as CoreBlockStream,
	type WatchOptions,
} from "@tevm/voltaire/block";
import * as Effect from "effect/Effect";
import * as Runtime from "effect/Runtime";
import * as Stream from "effect/Stream";
import { TransportError } from "../../Transport/TransportError.js";
import { ProviderService } from "../ProviderService.js";
import { ProviderStreamError, type WatchBlocksError } from "../types.js";

/**
 * Watches for new blocks with reorg detection.
 *
 * Uses the core BlockStream to continuously poll for new blocks,
 * tracking chain state to detect and report reorganizations.
 *
 * @param options - Watch options including optional fromBlock and include level
 * @returns Stream yielding BlockStreamEvents (blocks or reorg events)
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect, Stream } from 'effect'
 * import { watchBlocks, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = watchBlocks({ include: 'transactions' }).pipe(
 *   Stream.tap((event) =>
 *     Effect.sync(() => {
 *       if (event.type === 'reorg') {
 *         console.log('Reorg detected:', event.removed.length, 'blocks removed')
 *       } else {
 *         console.log('New blocks:', event.blocks.length)
 *       }
 *     })
 *   ),
 *   Stream.take(10),
 *   Stream.runDrain,
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const watchBlocks = <TInclude extends BlockInclude = "header">(
	options?: WatchOptions<TInclude>,
): Stream.Stream<BlockStreamEvent<TInclude>, WatchBlocksError, ProviderService> =>
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
				Effect.sync(() => coreStream.watch(options)),
				() => Effect.sync(cleanup),
			).pipe(
				Stream.flatMap((generator) =>
					Stream.fromAsyncIterable(
						{ [Symbol.asyncIterator]: () => generator },
						(error) =>
							error instanceof TransportError
								? error
								: new ProviderStreamError(
										{ method: "watchBlocks", options },
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
