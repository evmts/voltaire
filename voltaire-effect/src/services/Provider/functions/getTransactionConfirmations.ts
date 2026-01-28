/**
 * @fileoverview Free function to get transaction confirmations.
 *
 * @module Provider/functions/getTransactionConfirmations
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import type { TransportError } from "../../Transport/TransportError.js";
import { ProviderService } from "../ProviderService.js";
import {
	type HashInput,
	type ProviderResponseError,
	type ReceiptType,
} from "../types.js";
import { parseHexToBigInt, toHashHex } from "../utils.js";

/**
 * Gets the number of confirmations for a transaction.
 *
 * @param hash - The transaction hash
 * @returns Effect yielding the number of confirmations (0n if not yet mined)
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getTransactionConfirmations, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const confirmations = yield* getTransactionConfirmations('0x...')
 *   if (confirmations >= 12n) {
 *     console.log('Transaction is confirmed')
 *   }
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getTransactionConfirmations = (
	hash: HashInput,
): Effect.Effect<bigint, TransportError | ProviderResponseError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		Effect.gen(function* () {
			const hashHex = toHashHex(hash);
			const receipt = yield* svc.request<ReceiptType | null>(
				"eth_getTransactionReceipt",
				[hashHex],
			);
			if (!receipt) {
				return 0n;
			}
			const currentBlockHex = yield* svc.request<string>("eth_blockNumber");
			const receiptBlock = yield* parseHexToBigInt({
				method: "eth_getTransactionReceipt",
				params: [hashHex],
				response: receipt.blockNumber,
			});
			const currentBlock = yield* parseHexToBigInt({
				method: "eth_blockNumber",
				response: currentBlockHex,
			});
			if (currentBlock < receiptBlock) {
				return 0n;
			}
			return currentBlock - receiptBlock + 1n;
		}),
	);
