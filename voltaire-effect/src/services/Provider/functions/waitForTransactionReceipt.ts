/**
 * @fileoverview Free function to wait for a transaction receipt.
 *
 * @module Provider/functions/waitForTransactionReceipt
 * @since 0.4.0
 */

import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Schedule from "effect/Schedule";
import type { TransportError } from "../../Transport/TransportError.js";
import { ProviderService } from "../ProviderService.js";
import {
	type HashInput,
	ProviderConfirmationsPendingError,
	ProviderReceiptPendingError,
	type ProviderResponseError,
	ProviderTimeoutError,
	type ReceiptType,
} from "../types.js";
import { parseHexToBigInt, toHashHex } from "../utils.js";

/**
 * Options for waiting for a transaction receipt.
 */
export interface WaitForTransactionReceiptOptions {
	readonly confirmations?: number;
	readonly timeout?: number;
	readonly pollingInterval?: number;
}

/**
 * Waits for a transaction to be mined and confirmed.
 *
 * @param hash - The transaction hash
 * @param opts - Options for confirmations, timeout, and polling interval
 * @returns Effect yielding the transaction receipt
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { waitForTransactionReceipt, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const receipt = yield* waitForTransactionReceipt('0x...', {
 *     confirmations: 3,
 *     timeout: 60000
 *   })
 *   console.log(`Transaction mined in block ${receipt.blockNumber}`)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const waitForTransactionReceipt = (
	hash: HashInput,
	opts?: WaitForTransactionReceiptOptions,
): Effect.Effect<
	ReceiptType,
	TransportError | ProviderResponseError | ProviderTimeoutError,
	ProviderService
> =>
	Effect.flatMap(ProviderService, (svc) =>
		Effect.gen(function* () {
			const confirmations = opts?.confirmations ?? 1;
			const timeout = opts?.timeout ?? 120_000;
			const pollingInterval = opts?.pollingInterval ?? 4_000;
			const hashHex = toHashHex(hash);

			const pollReceipt = svc
				.request<ReceiptType | null>("eth_getTransactionReceipt", [hashHex])
				.pipe(
					Effect.flatMap((receipt) =>
						receipt
							? Effect.succeed(receipt)
							: Effect.fail(
									new ProviderReceiptPendingError(hash, "Transaction pending"),
								),
					),
				);

			const receipt = yield* pollReceipt.pipe(
				Effect.retry(
					Schedule.spaced(Duration.millis(pollingInterval)).pipe(
						Schedule.intersect(Schedule.recurUpTo(Duration.millis(timeout))),
						Schedule.whileInput(
							(e) =>
								(e as ProviderReceiptPendingError)._tag ===
								"ProviderReceiptPendingError",
						),
					),
				),
				Effect.catchTag("ProviderReceiptPendingError", () =>
					Effect.fail(
						new ProviderTimeoutError(
							hash,
							"Timeout waiting for transaction receipt",
							{ timeoutMs: timeout },
						),
					),
				),
				Effect.timeoutFail({
					duration: Duration.millis(timeout),
					onTimeout: () =>
						new ProviderTimeoutError(
							hash,
							"Timeout waiting for transaction receipt",
							{ timeoutMs: timeout },
						),
				}),
			);

			if (confirmations <= 1) {
				return receipt;
			}

			const receiptBlockNumber = yield* parseHexToBigInt({
				method: "eth_getTransactionReceipt",
				params: [hashHex],
				response: receipt.blockNumber,
			});
			const targetBlock = receiptBlockNumber + BigInt(confirmations - 1);

			const pollConfirmations = Effect.gen(function* () {
				const currentBlockHex = yield* svc.request<string>("eth_blockNumber");
				const currentBlock = yield* parseHexToBigInt({
					method: "eth_blockNumber",
					response: currentBlockHex,
				});
				if (currentBlock >= targetBlock) {
					return receipt;
				}
				return yield* Effect.fail(
					new ProviderConfirmationsPendingError(hash, "Waiting for confirmations"),
				);
			});

			return yield* pollConfirmations.pipe(
				Effect.retry(
					Schedule.spaced(Duration.millis(pollingInterval)).pipe(
						Schedule.intersect(Schedule.recurUpTo(Duration.millis(timeout))),
						Schedule.whileInput(
							(e) =>
								(e as ProviderConfirmationsPendingError)._tag ===
								"ProviderConfirmationsPendingError",
						),
					),
				),
				Effect.catchTag("ProviderConfirmationsPendingError", () =>
					Effect.fail(
						new ProviderTimeoutError(hash, "Timeout waiting for confirmations", {
							timeoutMs: timeout,
						}),
					),
				),
				Effect.timeoutFail({
					duration: Duration.millis(timeout),
					onTimeout: () =>
						new ProviderTimeoutError(hash, "Timeout waiting for confirmations", {
							timeoutMs: timeout,
						}),
				}),
			);
		}),
	);
