/**
 * @fileoverview Live implementation of BlockStreamService.
 *
 * @module BlockStream
 * @since 0.2.12
 *
 * @description
 * Provides the live implementation layer for BlockStreamService.
 * Creates an EIP-1193 provider from TransportService and wraps core BlockStream.
 */

import {
	BlockStream as CoreBlockStream,
	type BackfillOptions,
	type BlockInclude,
	type BlocksEvent,
	type BlockStreamEvent,
	type WatchOptions,
} from "@tevm/voltaire/block";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Runtime from "effect/Runtime";
import * as Stream from "effect/Stream";
import { TransportService } from "../Transport/TransportService.js";
import { BlockStreamError } from "./BlockStreamError.js";
import { BlockStreamService } from "./BlockStreamService.js";

/**
 * Wraps an AsyncGenerator as an Effect Stream with cleanup on interruption.
 */
const fromAsyncGeneratorWithCleanup = <T>(
	makeGenerator: () => AsyncGenerator<T>,
	cleanup: () => void,
): Stream.Stream<T, BlockStreamError> =>
	Stream.acquireRelease(
		Effect.sync(() => makeGenerator()),
		() => Effect.sync(cleanup),
	).pipe(
		Stream.flatMap((generator) =>
			Stream.fromAsyncIterable(
				{ [Symbol.asyncIterator]: () => generator },
				(error) =>
					new BlockStreamError(
						error instanceof Error ? error.message : "BlockStream error",
						{ cause: error instanceof Error ? error : undefined },
					),
			),
		),
	);

/**
 * Live implementation of BlockStreamService.
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
 *   yield* Stream.runForEach(
 *     blockStream.watch(),
 *     (event) => Effect.log(`Event: ${event.type}`)
 *   );
 * }).pipe(
 *   Effect.provide(BlockStream),
 *   Effect.provide(HttpTransport('https://...'))
 * );
 * ```
 */
export const BlockStream: Layer.Layer<
	BlockStreamService,
	never,
	TransportService
> = Layer.effect(
	BlockStreamService,
	Effect.gen(function* () {
		const transport = yield* TransportService;
		const runtime = yield* Effect.runtime<never>();

		const provider = {
			request: async ({
				method,
				params,
			}: { method: string; params?: unknown[] }) =>
				Runtime.runPromise(runtime)(transport.request(method, params)),
			on: () => {},
			removeListener: () => {},
		};

		const coreStream = CoreBlockStream({ provider: provider as any });

		const cleanup = () => {
			coreStream.destroy?.();
		};

		return {
			backfill: <TInclude extends BlockInclude = "header">(
				options: BackfillOptions<TInclude>,
			): Stream.Stream<BlocksEvent<TInclude>, BlockStreamError> =>
				fromAsyncGeneratorWithCleanup(() => coreStream.backfill(options), cleanup),

			watch: <TInclude extends BlockInclude = "header">(
				options?: WatchOptions<TInclude>,
			): Stream.Stream<BlockStreamEvent<TInclude>, BlockStreamError> =>
				fromAsyncGeneratorWithCleanup(() => coreStream.watch(options), cleanup),
		};
	}),
);
