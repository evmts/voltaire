import { CHAIN_METADATA, DEFAULT_METADATA } from "./metadata.js";

/**
 * Get the average block time in seconds
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {number} Block time in seconds
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * const blockTime = Chain.getBlockTime(mainnet);
 * // => 12
 * ```
 */
export function getBlockTime(chain) {
	const metadata = CHAIN_METADATA[chain.chainId] || DEFAULT_METADATA;
	return metadata.blockTime;
}
