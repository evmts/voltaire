/**
 * Create TokenBalance from bigint, number, or string
 *
 * @see https://voltaire.tevm.sh/primitives/token-balance for TokenBalance documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./TokenBalanceType.js').TokenBalanceType} TokenBalance value
 * @throws {InvalidTokenBalanceError} If value is out of range or invalid
 * @example
 * ```javascript
 * import * as TokenBalance from './primitives/TokenBalance/index.js';
 * const balance = TokenBalance.from(1000000000000000000n); // 1 token with 18 decimals
 * const fromNumber = TokenBalance.from(100);
 * const fromHex = TokenBalance.from("0xff");
 * ```
 */
export function from(value: bigint | number | string): import("./TokenBalanceType.js").TokenBalanceType;
//# sourceMappingURL=from.d.ts.map