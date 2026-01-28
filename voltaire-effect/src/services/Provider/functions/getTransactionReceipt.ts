/**
 * @fileoverview Free function to get a transaction receipt by hash.
 *
 * @module Provider/functions/getTransactionReceipt
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import type { TransportError } from "../../Transport/TransportError.js";
import { ProviderService } from "../ProviderService.js";
import {
	type HashInput,
	ProviderNotFoundError,
	type ReceiptType,
} from "../types.js";
import { toHashHex } from "../utils.js";

/**
 * Gets a transaction receipt by its hash.
 *
 * @param hash - The transaction hash
 * @returns Effect yielding the receipt
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getTransactionReceipt, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const receipt = yield* getTransactionReceipt('0x...')
 *   console.log(`Status: ${receipt.status}`)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getTransactionReceipt = (
	hash: HashInput,
): Effect.Effect<ReceiptType, TransportError | ProviderNotFoundError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc
			.request<ReceiptType | null>("eth_getTransactionReceipt", [toHashHex(hash)])
			.pipe(
				Effect.flatMap((result) =>
					result === null
						? Effect.fail(
								new ProviderNotFoundError(hash, "Transaction receipt not found", {
									resource: "receipt",
								}),
							)
						: Effect.succeed(result),
				),
			),
	);
