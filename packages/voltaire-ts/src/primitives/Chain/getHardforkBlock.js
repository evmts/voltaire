import { CHAIN_METADATA } from "./metadata.js";

/**
 * Get the activation block number for a hardfork
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @param {import('./metadata.js').Hardfork} hardfork - Hardfork name
 * @returns {number | undefined} Block number or undefined if not supported
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * const block = Chain.getHardforkBlock(mainnet, 'london');
 * // => 12965000
 * ```
 */
export function getHardforkBlock(chain, hardfork) {
	const metadata = CHAIN_METADATA[chain.chainId];
	return metadata?.hardforks[hardfork];
}
