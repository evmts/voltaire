/**
 * @fileoverview Free function to sign a message using an unlocked account.
 *
 * @module Provider/functions/sign
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import { toAddressHex } from "../utils.js";
import type { AddressInput } from "../types.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Signs a message using an unlocked account via eth_sign.
 *
 * This is a node-dependent operation that requires the address to be
 * unlocked on the node. The message is prefixed with the Ethereum
 * signed message prefix before signing.
 *
 * @param address - Address of the account to sign with
 * @param message - Hex-encoded message to sign
 * @returns Effect yielding the signature
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { sign, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const signature = yield* sign(
 *     '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 *     '0x48656c6c6f20576f726c64' // "Hello World"
 *   )
 *   console.log('Signature:', signature)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('http://localhost:8545'))
 * )
 * ```
 */
export const sign = (
	address: AddressInput,
	message: `0x${string}`,
): Effect.Effect<`0x${string}`, TransportError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<`0x${string}`>("eth_sign", [toAddressHex(address), message]),
	);
