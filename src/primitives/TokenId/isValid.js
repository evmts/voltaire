/**
 * Check if TokenId is valid (non-zero)
 *
 * @see https://voltaire.tevm.sh/primitives/token-id for TokenId documentation
 * @since 0.0.0
 * @param {import('./TokenIdType.js').TokenIdType} tokenId - TokenId value to check
 * @returns {boolean} true if valid (non-zero)
 * @example
 * ```javascript
 * import * as TokenId from './primitives/TokenId/index.js';
 * const tokenId = TokenId.from(42n);
 * const valid = TokenId.isValid(tokenId); // true
 * const zero = TokenId.from(0n);
 * const invalid = TokenId.isValid(zero); // false
 * ```
 */
export function isValid(tokenId) {
	return tokenId !== 0n;
}
