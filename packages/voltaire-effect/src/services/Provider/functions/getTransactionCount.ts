/**
 * @fileoverview Free function to get account transaction count (nonce).
 *
 * @module Provider/functions/getTransactionCount
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { AddressInput, BlockTag } from "../types.js";
import { toAddressHex, parseHexToBigInt } from "../utils.js";
import type { TransportError } from "../../Transport/TransportError.js";
import type { ProviderResponseError } from "../types.js";

/**
 * Gets the transaction count (nonce) for an address.
 *
 * @param address - The address to check nonce for
 * @param blockTag - Block to query at (default: "latest")
 * @returns Effect yielding the nonce as bigint
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getTransactionCount, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const nonce = yield* getTransactionCount('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
 *   console.log(`Nonce: ${nonce}`)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getTransactionCount = (
	address: AddressInput,
	blockTag: BlockTag = "latest",
): Effect.Effect<bigint, TransportError | ProviderResponseError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc
			.request<string>("eth_getTransactionCount", [toAddressHex(address), blockTag])
			.pipe(
				Effect.flatMap((response) =>
					parseHexToBigInt({ method: "eth_getTransactionCount", response, params: [address, blockTag] }),
				),
			),
	);
