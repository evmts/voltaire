/**
 * Convert TokenId to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/token-id for TokenId documentation
 * @since 0.0.0
 * @param {import('./TokenIdType.js').TokenIdType} tokenId - TokenId value to convert
 * @returns {import('../Hex/HexType.js').HexType} Hex string with 0x prefix
 * @example
 * ```javascript
 * import * as TokenId from './primitives/TokenId/index.js';
 * const tokenId = TokenId.from(42n);
 * const hex = TokenId.toHex(tokenId); // "0x2a"
 * ```
 */
export function toHex(tokenId: import("./TokenIdType.js").TokenIdType): import("../Hex/HexType.js").HexType;
//# sourceMappingURL=toHex.d.ts.map