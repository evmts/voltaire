import { CHAIN_METADATA, DEFAULT_METADATA } from "./metadata.js";

/**
 * Get the block gas limit
 *
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {number} Gas limit
 *
 * @example
 * ```typescript
 * import * as Chain from './primitives/Chain/index.js';
 * const gasLimit = Chain.getGasLimit(mainnet);
 * // => 30000000
 * ```
 */
export function getGasLimit(chain) {
	const metadata = CHAIN_METADATA[chain.chainId] || DEFAULT_METADATA;
	return metadata.gasLimit;
}
