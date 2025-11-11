import { CHAIN_METADATA, DEFAULT_METADATA } from "./metadata.js";

/**
 * Get the block gas limit
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {number} Gas limit
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * const gasLimit = Chain.getGasLimit(mainnet);
 * // => 30000000
 * ```
 */
export function getGasLimit(chain) {
	const metadata = CHAIN_METADATA[chain.chainId] || DEFAULT_METADATA;
	return metadata.gasLimit;
}
