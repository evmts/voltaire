/**
 * Convert TokenBalance to number (unsafe for large values)
 *
 * @see https://voltaire.tevm.sh/primitives/token-balance for TokenBalance documentation
 * @since 0.0.0
 * @param {import('./TokenBalanceType.js').TokenBalanceType} balance - TokenBalance value to convert
 * @returns {number} number value
 * @throws {RangeError} If value exceeds Number.MAX_SAFE_INTEGER
 * @example
 * ```javascript
 * import * as TokenBalance from './primitives/TokenBalance/index.js';
 * const balance = TokenBalance.from(100n);
 * const num = TokenBalance.toNumber(balance); // 100
 * ```
 */
export function toNumber(balance) {
	if (balance > Number.MAX_SAFE_INTEGER) {
		throw new RangeError(
			`TokenBalance value ${balance} exceeds Number.MAX_SAFE_INTEGER`,
		);
	}
	return Number(balance);
}
