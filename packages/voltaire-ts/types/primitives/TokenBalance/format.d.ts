/**
 * Format TokenBalance for display with decimals
 *
 * @see https://voltaire.tevm.sh/primitives/token-balance for TokenBalance documentation
 * @since 0.0.0
 * @param {import('./TokenBalanceType.js').TokenBalanceType} balance - TokenBalance value
 * @param {number} decimals - Number of decimal places (e.g., 18 for ETH, 6 for USDC)
 * @param {number} [maxDecimals] - Maximum decimal places to display (for rounding)
 * @returns {string} Formatted string (e.g., "1.234567")
 * @example
 * ```javascript
 * import * as TokenBalance from './primitives/TokenBalance/index.js';
 * const balance = TokenBalance.from(1234567890123456789n);
 * const formatted = TokenBalance.format(balance, 18); // "1.234567890123456789"
 * const rounded = TokenBalance.format(balance, 18, 6); // "1.234568"
 * ```
 */
export function format(balance: import("./TokenBalanceType.js").TokenBalanceType, decimals: number, maxDecimals?: number): string;
//# sourceMappingURL=format.d.ts.map