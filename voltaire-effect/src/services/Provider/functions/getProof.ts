/**
 * @fileoverview Free function to get Merkle-Patricia proof for an account.
 *
 * @module Provider/functions/getProof
 * @since 0.4.0
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import type { AddressInput, BlockTag, HashInput, ProofType } from "../types.js";
import { toAddressHex, toHashHex } from "../utils.js";
import type { TransportError } from "../../Transport/TransportError.js";

/**
 * Gets a Merkle-Patricia proof for an account and storage slots.
 *
 * @param address - The address to get proof for
 * @param storageKeys - Array of storage slots to include in proof
 * @param blockTag - Block to query at (default: "latest")
 * @returns Effect yielding the proof
 *
 * @since 0.4.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { getProof, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const proof = yield* getProof(
 *     '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *     ['0x0000000000000000000000000000000000000000000000000000000000000000']
 *   )
 *   console.log(`Account proof nodes: ${proof.accountProof.length}`)
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const getProof = (
	address: AddressInput,
	storageKeys: HashInput[],
	blockTag: BlockTag = "latest",
): Effect.Effect<ProofType, TransportError, ProviderService> =>
	Effect.flatMap(ProviderService, (svc) =>
		svc.request<ProofType>("eth_getProof", [
			toAddressHex(address),
			storageKeys.map(toHashHex),
			blockTag,
		]),
	);
