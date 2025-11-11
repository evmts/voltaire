import { CHAIN_METADATA } from "./metadata.js";

/**
 * Check if a chain supports a specific hardfork
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @param {import('./metadata.js').Hardfork} hardfork - Hardfork name
 * @returns {boolean} True if hardfork is supported
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * Chain.supportsHardfork(mainnet, 'london');  // => true
 * Chain.supportsHardfork(mainnet, 'prague');  // => false
 * ```
 */
export function supportsHardfork(chain, hardfork) {
	const metadata = CHAIN_METADATA[chain.chainId];
	return metadata?.hardforks[hardfork] !== undefined;
}
