/**
 * Get the native currency symbol
 *
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {string} Native currency symbol (e.g., "ETH")
 *
 * @example
 * ```typescript
 * import * as Chain from './primitives/Chain/index.js';
 * const symbol = Chain.getSymbol(mainnet);
 * // => "ETH"
 * ```
 */
export function getSymbol(chain) {
	return chain.nativeCurrency.symbol;
}
