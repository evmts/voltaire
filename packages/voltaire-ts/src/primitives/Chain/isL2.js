import { CHAIN_METADATA, DEFAULT_METADATA } from "./metadata.js";

/**
 * Check if chain is a Layer 2
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {boolean} True if L2
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * Chain.isL2(mainnet);   // => false
 * Chain.isL2(optimism);  // => true
 * ```
 */
export function isL2(chain) {
	const metadata = CHAIN_METADATA[chain.chainId] || DEFAULT_METADATA;
	return metadata.isL2;
}
