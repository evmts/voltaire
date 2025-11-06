/**
 * Get the primary block explorer URL
 *
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {string | undefined} Block explorer URL or undefined if none
 *
 * @example
 * ```typescript
 * import * as Chain from './primitives/Chain/index.js';
 * const explorer = Chain.getExplorerUrl(mainnet);
 * // => "https://etherscan.io"
 * ```
 */
export function getExplorerUrl(chain) {
	return chain.explorers?.[0]?.url;
}
