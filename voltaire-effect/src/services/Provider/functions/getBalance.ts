/**
 * @fileoverview Free function to get account balance.
 *
 * @module Provider/functions/getBalance
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { AddressInput, BlockTag } from "../types.js";
import { toAddressHex, parseHexToBigInt } from "../utils.js";
import type { TransportError } from "../../Transport/TransportError.js";
import type { ProviderResponseError } from "../types.js";

/**
 * Gets the balance of an address in wei.
 *
 * @param address - The address to check balance for
 * @param blockTag - Block to query at (default: "latest")
 * @returns Effect yielding the balance as bigint
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getBalance, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const balance = yield* getBalance('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
 *   console.log(`Balance: ${balance} wei`)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getBalance = (
	address: AddressInput,
	blockTag: BlockTag = "latest",
): Effect.Effect<bigint, TransportError | ProviderResponseError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc
			.request<string>("eth_getBalance", [toAddressHex(address), blockTag])
			.pipe(
				Effect.flatMap((response) =>
					parseHexToBigInt({ method: "eth_getBalance", response, params: [address, blockTag] }),
				),
			),
	);
