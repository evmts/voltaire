/**
 * Convert TokenId to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/token-id for TokenId documentation
 * @since 0.0.0
 * @param {import('./TokenIdType.js').TokenIdType} tokenId - TokenId value to convert
 * @returns {bigint} bigint value
 * @example
 * ```javascript
 * import * as TokenId from './primitives/TokenId/index.js';
 * const tokenId = TokenId.from(42n);
 * const bigint = TokenId.toBigInt(tokenId); // 42n
 * ```
 */
export function toBigInt(tokenId: import("./TokenIdType.js").TokenIdType): bigint;
//# sourceMappingURL=toBigInt.d.ts.map