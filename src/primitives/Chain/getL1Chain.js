import { fromId } from "./BrandedChain/fromId.js";
import { CHAIN_METADATA } from "./metadata.js";

/**
 * Get the parent L1 chain for an L2
 *
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {import('./ChainType.js').Chain | undefined} L1 chain or undefined
 *
 * @example
 * ```typescript
 * import * as Chain from './primitives/Chain/index.js';
 * const l1 = Chain.getL1Chain(optimism);
 * // => mainnet chain object
 * ```
 */
export function getL1Chain(chain) {
	const metadata = CHAIN_METADATA[chain.chainId];
	if (!metadata?.l1ChainId) {
		return undefined;
	}
	return fromId(metadata.l1ChainId);
}
