/**
 * Get the primary block explorer URL
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {string | undefined} Block explorer URL or undefined if none
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * const explorer = Chain.getExplorerUrl(mainnet);
 * // => "https://etherscan.io"
 * ```
 */
export function getExplorerUrl(chain) {
	return chain.explorers?.[0]?.url;
}
