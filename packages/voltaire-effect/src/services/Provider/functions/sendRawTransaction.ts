/**
 * @fileoverview Free function to send a raw signed transaction.
 *
 * @module Provider/functions/sendRawTransaction
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import type { TransportError } from "../../Transport/TransportError.js";
import { ProviderService } from "../ProviderService.js";

/**
 * Sends a raw signed transaction.
 *
 * @param signedTx - The signed transaction as a hex string
 * @returns Effect yielding the transaction hash
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { sendRawTransaction, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const signedTx = '0x...' // Your signed transaction
 *   const txHash = yield* sendRawTransaction(signedTx)
 *   console.log(`Transaction submitted: ${txHash}`)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const sendRawTransaction = (
	signedTx: `0x${string}`,
): Effect.Effect<`0x${string}`, TransportError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<`0x${string}`>("eth_sendRawTransaction", [signedTx]),
	);
