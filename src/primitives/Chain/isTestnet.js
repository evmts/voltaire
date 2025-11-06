import { CHAIN_METADATA, DEFAULT_METADATA } from "./metadata.js";

/**
 * Check if chain is a testnet
 *
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {boolean} True if testnet
 *
 * @example
 * ```typescript
 * import * as Chain from './primitives/Chain/index.js';
 * Chain.isTestnet(mainnet);  // => false
 * Chain.isTestnet(sepolia);  // => true
 * ```
 */
export function isTestnet(chain) {
	const metadata = CHAIN_METADATA[chain.chainId] || DEFAULT_METADATA;
	return metadata.isTestnet;
}
