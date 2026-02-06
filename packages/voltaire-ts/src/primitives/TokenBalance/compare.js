/**
 * Compare two TokenBalance values
 *
 * @see https://voltaire.tevm.sh/primitives/token-balance for TokenBalance documentation
 * @since 0.0.0
 * @param {import('./TokenBalanceType.js').TokenBalanceType} a - First TokenBalance
 * @param {import('./TokenBalanceType.js').TokenBalanceType} b - Second TokenBalance
 * @returns {number} -1 if a < b, 0 if a === b, 1 if a > b
 * @example
 * ```javascript
 * import * as TokenBalance from './primitives/TokenBalance/index.js';
 * const a = TokenBalance.from(100n);
 * const b = TokenBalance.from(200n);
 * const result = TokenBalance.compare(a, b); // -1
 * ```
 */
export function compare(a, b) {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}
