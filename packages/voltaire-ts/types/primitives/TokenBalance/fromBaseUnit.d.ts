/**
 * Convert from human-readable base unit to raw TokenBalance
 *
 * @see https://voltaire.tevm.sh/primitives/token-balance for TokenBalance documentation
 * @since 0.0.0
 * @param {string} amount - Human-readable amount (e.g., "1.5" for 1.5 tokens)
 * @param {number} decimals - Number of decimal places (e.g., 18 for ETH, 6 for USDC)
 * @returns {import('./TokenBalanceType.js').TokenBalanceType} TokenBalance value
 * @throws {Error} If amount format is invalid
 * @example
 * ```javascript
 * import * as TokenBalance from './primitives/TokenBalance/index.js';
 * const balance = TokenBalance.fromBaseUnit("1.5", 18); // 1500000000000000000n
 * const usdc = TokenBalance.fromBaseUnit("100.5", 6); // 100500000n
 * ```
 */
export function fromBaseUnit(amount: string, decimals: number): import("./TokenBalanceType.js").TokenBalanceType;
//# sourceMappingURL=fromBaseUnit.d.ts.map