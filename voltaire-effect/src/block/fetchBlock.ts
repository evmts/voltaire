/**
 * @fileoverview Effect-wrapped fetchBlock for one-off block fetching.
 *
 * @module fetchBlock
 * @since 0.3.0
 */

import type {
	BlockInclude,
	RetryOptions,
	StreamBlock,
} from "@tevm/voltaire/block";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Schedule from "effect/Schedule";
import { TransportService } from "../services/Transport/TransportService.js";
import { BlockError, BlockNotFoundError } from "./BlockError.js";
import { createFetchBlockReceipts } from "./fetchBlockReceipts.js";

/**
 * Fetch a block by number with optional transaction inclusion.
 *
 * @since 0.3.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import * as Block from 'voltaire-effect/block'
 * import { HttpTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const block = yield* Block.fetchBlock(18000000n, 'header')
 *   console.log('Block:', block.hash)
 * }).pipe(Effect.provide(HttpTransport('https://eth.llamarpc.com')))
 * ```
 */
export const fetchBlock = <TInclude extends BlockInclude = "header">(
	blockNumber: bigint,
	include: TInclude = "header" as TInclude,
	retryOptions?: RetryOptions,
): Effect.Effect<
	StreamBlock<TInclude>,
	BlockError | BlockNotFoundError,
	TransportService
> => {
	const maxRetries = retryOptions?.maxRetries ?? 3;
	const initialDelay = retryOptions?.initialDelay ?? 1000;
	const maxDelay = retryOptions?.maxDelay ?? 30000;

	const retrySchedule = Schedule.exponential(
		Duration.millis(initialDelay),
	).pipe(
		Schedule.jittered,
		Schedule.compose(Schedule.recurs(maxRetries)),
		Schedule.whileOutput((duration) =>
			Duration.lessThanOrEqualTo(duration, Duration.millis(maxDelay)),
		),
	);

	const includeTransactions = include !== "header";

	const fetchEffect = Effect.gen(function* () {
		const transport = yield* TransportService;

		const block = yield* transport
			.request("eth_getBlockByNumber", [
				`0x${blockNumber.toString(16)}`,
				includeTransactions,
			])
			.pipe(
				Effect.mapError(
					(e) =>
						new BlockError(`Failed to fetch block ${blockNumber}`, {
							cause: e,
						}),
				),
			);

		if (!block) {
			return yield* Effect.fail(new BlockNotFoundError(blockNumber));
		}

		if (include === "receipts") {
			const receipts = yield* createFetchBlockReceipts(
				block as Record<string, unknown>,
				retryOptions,
			);
			return { ...block, receipts } as unknown as StreamBlock<TInclude>;
		}

		return block as unknown as StreamBlock<TInclude>;
	});

	return fetchEffect.pipe(
		Effect.retry({
			schedule: retrySchedule,
			while: (error) => error instanceof BlockError,
		}),
	);
};
