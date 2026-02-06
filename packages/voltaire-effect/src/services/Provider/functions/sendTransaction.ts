/**
 * @fileoverview Free function to send a transaction from an unlocked account.
 *
 * @module Provider/functions/sendTransaction
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import { formatTransactionRequest, type RpcTransactionRequest } from "../utils.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Sends a transaction from an unlocked account using eth_sendTransaction.
 *
 * This is a node-dependent operation that requires the from address to be
 * unlocked on the node (e.g., for local development or test nodes).
 * For sending signed transactions, use sendRawTransaction instead.
 *
 * @param tx - Transaction request with from, to, value, data, etc.
 * @returns Effect yielding the transaction hash
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { sendTransaction, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const txHash = yield* sendTransaction({
 *     from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 *     to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
 *     value: 1000000000000000000n, // 1 ETH
 *   })
 *   console.log('Transaction hash:', txHash)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('http://localhost:8545'))
 * )
 * ```
 */
export const sendTransaction = (
	tx: RpcTransactionRequest,
): Effect.Effect<`0x${string}`, TransportError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<`0x${string}`>("eth_sendTransaction", [formatTransactionRequest(tx)]),
	);
