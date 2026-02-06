/**
 * @fileoverview Free function to get contract bytecode.
 *
 * @module Provider/functions/getCode
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { AddressInput, BlockTag } from "../types.js";
import { toAddressHex } from "../utils.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Gets the bytecode at an address.
 *
 * @param address - The address to get code from
 * @param blockTag - Block to query at (default: "latest")
 * @returns Effect yielding the bytecode as hex string
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getCode, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const code = yield* getCode('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
 *   console.log(`Code length: ${(code.length - 2) / 2} bytes`)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getCode = (
	address: AddressInput,
	blockTag: BlockTag = "latest",
): Effect.Effect<`0x${string}`, TransportError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<`0x${string}`>("eth_getCode", [toAddressHex(address), blockTag]),
	);
