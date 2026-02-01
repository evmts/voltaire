/**
 * Convert TokenBalance to base unit bigint (raw value)
 *
 * @see https://voltaire.tevm.sh/primitives/token-balance for TokenBalance documentation
 * @since 0.0.0
 * @param {import('./TokenBalanceType.js').TokenBalanceType} balance - TokenBalance value
 * @returns {bigint} Raw bigint value
 * @example
 * ```javascript
 * import * as TokenBalance from './primitives/TokenBalance/index.js';
 * const balance = TokenBalance.from(1500000000000000000n);
 * const raw = TokenBalance.toBaseUnit(balance); // 1500000000000000000n
 * ```
 */
export function toBaseUnit(balance) {
	return balance;
}
