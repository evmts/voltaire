import { CHAIN_METADATA, DEFAULT_METADATA } from "./metadata.js";

/**
 * Get the latest active hardfork for a chain
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {import('./metadata.js').Hardfork} Latest hardfork name
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * const hardfork = Chain.getLatestHardfork(mainnet);
 * // => "cancun"
 * ```
 */
export function getLatestHardfork(chain) {
	const metadata = CHAIN_METADATA[chain.chainId] || DEFAULT_METADATA;
	return metadata.latestHardfork;
}
