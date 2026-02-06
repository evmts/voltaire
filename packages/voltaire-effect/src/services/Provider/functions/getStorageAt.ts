/**
 * @fileoverview Free function to get storage at a slot.
 *
 * @module Provider/functions/getStorageAt
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { AddressInput, BlockTag, HashInput } from "../types.js";
import { toAddressHex, toHashHex } from "../utils.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Gets storage at a specific slot for an address.
 *
 * @param address - The contract address
 * @param slot - The storage slot to read
 * @param blockTag - Block to query at (default: "latest")
 * @returns Effect yielding the storage value as hex string
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getStorageAt, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const value = yield* getStorageAt(
 *     '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *     '0x0000000000000000000000000000000000000000000000000000000000000000'
 *   )
 *   console.log(`Storage slot 0: ${value}`)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getStorageAt = (
	address: AddressInput,
	slot: HashInput,
	blockTag: BlockTag = "latest",
): Effect.Effect<`0x${string}`, TransportError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<`0x${string}`>("eth_getStorageAt", [
			toAddressHex(address),
			toHashHex(slot),
			blockTag,
		]),
	);
