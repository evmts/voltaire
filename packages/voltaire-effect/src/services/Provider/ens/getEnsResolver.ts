/**
 * @fileoverview Gets the resolver address for an ENS name.
 * @module Provider/ens/getEnsResolver
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import { call } from "../functions/call.js";
import type { ProviderService } from "../ProviderService.js";
import { ENS_REGISTRY_ADDRESS } from "./constants.js";
import { EnsError } from "./EnsError.js";
import { namehash } from "./utils.js";

/**
 * Parameters for getEnsResolver.
 * @since 0.0.1
 */
export interface GetEnsResolverParams {
	/** ENS name to get resolver for */
	readonly name: string;
	/** Optional ENS Registry address override */
	readonly registryAddress?: `0x${string}`;
}

/**
 * Gets the resolver address for an ENS name.
 *
 * @description
 * Queries the ENS Registry to get the resolver contract address
 * for a given ENS name. Returns null if no resolver is set.
 *
 * @param params - Resolution parameters
 * @returns Effect yielding the resolver address or null
 *
 * @example
 * ```typescript
 * const resolver = yield* getEnsResolver({ name: 'vitalik.eth' })
 * // '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41'
 * ```
 *
 * @since 0.0.1
 */
export const getEnsResolver = (
	params: GetEnsResolverParams,
): Effect.Effect<`0x${string}` | null, EnsError, ProviderService> =>
	Effect.gen(function* () {
		const { name, registryAddress = ENS_REGISTRY_ADDRESS } = params;

		const node = namehash(name);

		// Encode resolver(bytes32) call
		// selector = 0x0178b8bf
		const selector = "0178b8bf";
		const nodeHex = node.slice(2);

		const callData = `0x${selector}${nodeHex}` as `0x${string}`;

		const result = yield* call({
			to: registryAddress,
			data: callData,
		}).pipe(
			Effect.mapError(
				(e) =>
					new EnsError(name, `Failed to get ENS resolver: ${e.message}`, e),
			),
		);

		if (!result || result === "0x" || result.length < 66) {
			return null;
		}

		// Result is address in last 20 bytes of 32-byte word
		const addressHex = result.slice(26, 66);
		if (addressHex === "0000000000000000000000000000000000000000") {
			return null;
		}

		return `0x${addressHex}` as `0x${string}`;
	});
