import { CHAIN_METADATA, DEFAULT_METADATA } from "./metadata.js";

/**
 * Check if chain is a testnet
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {boolean} True if testnet
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * Chain.isTestnet(mainnet);  // => false
 * Chain.isTestnet(sepolia);  // => true
 * ```
 */
export function isTestnet(chain) {
	const metadata = CHAIN_METADATA[chain.chainId] || DEFAULT_METADATA;
	return metadata.isTestnet;
}
