import { CHAIN_METADATA, DEFAULT_METADATA } from "./metadata.js";

/**
 * Get the average block time in seconds
 *
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {number} Block time in seconds
 *
 * @example
 * ```typescript
 * import * as Chain from './primitives/Chain/index.js';
 * const blockTime = Chain.getBlockTime(mainnet);
 * // => 12
 * ```
 */
export function getBlockTime(chain) {
	const metadata = CHAIN_METADATA[chain.chainId] || DEFAULT_METADATA;
	return metadata.blockTime;
}
