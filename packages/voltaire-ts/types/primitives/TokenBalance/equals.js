/**
 * Check if two TokenBalance values are equal
 *
 * @see https://voltaire.tevm.sh/primitives/token-balance for TokenBalance documentation
 * @since 0.0.0
 * @param {import('./TokenBalanceType.js').TokenBalanceType} a - First TokenBalance
 * @param {import('./TokenBalanceType.js').TokenBalanceType} b - Second TokenBalance
 * @returns {boolean} true if equal
 * @example
 * ```javascript
 * import * as TokenBalance from './primitives/TokenBalance/index.js';
 * const a = TokenBalance.from(100n);
 * const b = TokenBalance.from(100n);
 * const result = TokenBalance.equals(a, b); // true
 * ```
 */
export function equals(a, b) {
    return a === b;
}
