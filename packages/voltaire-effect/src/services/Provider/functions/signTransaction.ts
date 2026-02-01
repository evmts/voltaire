/**
 * @fileoverview Free function to sign a transaction using an unlocked account.
 *
 * @module Provider/functions/signTransaction
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import { formatTransactionRequest, type RpcTransactionRequest } from "../utils.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Signs a transaction using an unlocked account via eth_signTransaction.
 *
 * This is a node-dependent operation that requires the from address to be
 * unlocked on the node. Returns the signed transaction data that can be
 * broadcast later using sendRawTransaction.
 *
 * @param tx - Transaction request to sign
 * @returns Effect yielding the signed transaction data
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { signTransaction, sendRawTransaction, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const signedTx = yield* signTransaction({
 *     from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 *     to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
 *     value: 1000000000000000000n,
 *     nonce: 0n,
 *     gas: 21000n,
 *     maxFeePerGas: 20000000000n,
 *     maxPriorityFeePerGas: 1000000000n,
 *   })
 *   console.log('Signed transaction:', signedTx)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('http://localhost:8545'))
 * )
 * ```
 */
export const signTransaction = (
	tx: RpcTransactionRequest,
): Effect.Effect<unknown, TransportError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<unknown>("eth_signTransaction", [formatTransactionRequest(tx)]),
	);
