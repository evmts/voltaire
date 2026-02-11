/**
 * Convert TokenBalance to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/token-balance for TokenBalance documentation
 * @since 0.0.0
 * @param {import('./TokenBalanceType.js').TokenBalanceType} balance - TokenBalance value to convert
 * @returns {import('../Hex/HexType.js').HexType} Hex string with 0x prefix
 * @example
 * ```javascript
 * import * as TokenBalance from './primitives/TokenBalance/index.js';
 * const balance = TokenBalance.from(255n);
 * const hex = TokenBalance.toHex(balance); // "0xff"
 * ```
 */
export function toHex(balance: import("./TokenBalanceType.js").TokenBalanceType): import("../Hex/HexType.js").HexType;
//# sourceMappingURL=toHex.d.ts.map