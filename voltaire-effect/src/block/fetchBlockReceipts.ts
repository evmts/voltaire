/**
 * @fileoverview Effect-wrapped fetchBlockReceipts with fallback support.
 *
 * @module fetchBlockReceipts
 * @since 0.3.0
 */

import type { RetryOptions } from "@tevm/voltaire/block";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Schedule from "effect/Schedule";
import { TransportService } from "../services/Transport/TransportService.js";
import { BlockError } from "./BlockError.js";

/**
 * Fetch receipts for a block with fallback to individual receipt fetching.
 *
 * Tries `eth_getBlockReceipts` first, falls back to individual
 * `eth_getTransactionReceipt` calls if not supported.
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
 *   const block = { hash: '0x...', transactions: ['0x...'] }
 *   const receipts = yield* Block.fetchBlockReceipts(block)
 * }).pipe(Effect.provide(HttpTransport('https://eth.llamarpc.com')))
 * ```
 */
export const fetchBlockReceipts = (
	block: { hash: string; transactions?: unknown[] },
	retryOptions?: RetryOptions,
): Effect.Effect<unknown[], BlockError, TransportService> =>
	createFetchBlockReceipts(block as Record<string, unknown>, retryOptions);

/**
 * Internal implementation that returns an Effect for fetching receipts.
 * @internal
 */
export const createFetchBlockReceipts = (
	block: Record<string, unknown>,
	retryOptions?: RetryOptions,
): Effect.Effect<unknown[], BlockError, TransportService> =>
	Effect.gen(function* () {
		const transport = yield* TransportService;

		const maxRetries = retryOptions?.maxRetries ?? 3;
		const initialDelay = retryOptions?.initialDelay ?? 1000;
		const maxDelay = retryOptions?.maxDelay ?? 30000;

		const tryBlockReceipts = yield* transport
			.request("eth_getBlockReceipts", [block.hash])
			.pipe(
				Effect.map((result) => ({ success: true as const, receipts: result })),
				Effect.catchAll((error) => {
					const errorMsg = (
						(error as { message?: string }).message ?? String(error)
					).toLowerCase();
					if (
						errorMsg.includes("method not found") ||
						errorMsg.includes("not supported") ||
						errorMsg.includes("unknown method")
					) {
						return Effect.succeed({ success: false as const, receipts: null });
					}
					return Effect.fail(
						new BlockError("Failed to fetch block receipts", {
							cause: error instanceof Error ? error : undefined,
						}),
					);
				}),
			);

		if (tryBlockReceipts.success && tryBlockReceipts.receipts) {
			return tryBlockReceipts.receipts as unknown[];
		}

		const transactions =
			(block.body as { transactions?: unknown[] })?.transactions ??
			(block.transactions as unknown[]) ??
			[];

		const receipts = yield* Effect.all(
			transactions.map((tx) => {
				const txHash =
					typeof tx === "string" ? tx : (tx as { hash: string }).hash;
				return fetchSingleReceipt(txHash, maxRetries, initialDelay, maxDelay);
			}),
			{ concurrency: 10 },
		);

		return receipts.filter(Boolean);
	});

const fetchSingleReceipt = (
	txHash: string,
	maxRetries: number,
	initialDelay: number,
	maxDelay: number,
): Effect.Effect<unknown, BlockError, TransportService> => {
	const retrySchedule = Schedule.exponential(
		Duration.millis(initialDelay),
	).pipe(
		Schedule.jittered,
		Schedule.compose(Schedule.recurs(maxRetries)),
		Schedule.whileOutput((duration) =>
			Duration.lessThanOrEqualTo(duration, Duration.millis(maxDelay)),
		),
	);

	const fetchEffect = Effect.gen(function* () {
		const transport = yield* TransportService;
		return yield* transport.request("eth_getTransactionReceipt", [txHash]).pipe(
			Effect.mapError(
				(error) =>
					new BlockError(`Failed to fetch receipt ${txHash}`, {
						cause: error instanceof Error ? error : undefined,
					}),
			),
		);
	});

	return fetchEffect.pipe(Effect.retry(retrySchedule));
};
