/**
 * Convert TokenBalance to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/token-balance for TokenBalance documentation
 * @since 0.0.0
 * @param {import('./TokenBalanceType.js').TokenBalanceType} balance - TokenBalance value to convert
 * @returns {bigint} bigint value
 * @example
 * ```javascript
 * import * as TokenBalance from './primitives/TokenBalance/index.js';
 * const balance = TokenBalance.from(1000000n);
 * const bigint = TokenBalance.toBigInt(balance); // 1000000n
 * ```
 */
export function toBigInt(balance) {
    return balance;
}
