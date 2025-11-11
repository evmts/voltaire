/**
 * Get the native currency symbol
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {string} Native currency symbol (e.g., "ETH")
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * const symbol = Chain.getSymbol(mainnet);
 * // => "ETH"
 * ```
 */
export function getSymbol(chain) {
	return chain.nativeCurrency.symbol;
}
