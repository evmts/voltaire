/**
 * Convert TokenId to number (unsafe for large values)
 *
 * @see https://voltaire.tevm.sh/primitives/token-id for TokenId documentation
 * @since 0.0.0
 * @param {import('./TokenIdType.js').TokenIdType} tokenId - TokenId value to convert
 * @returns {number} number value
 * @throws {RangeError} If value exceeds Number.MAX_SAFE_INTEGER
 * @example
 * ```javascript
 * import * as TokenId from './primitives/TokenId/index.js';
 * const tokenId = TokenId.from(42n);
 * const num = TokenId.toNumber(tokenId); // 42
 * ```
 */
export function toNumber(tokenId) {
	if (tokenId > Number.MAX_SAFE_INTEGER) {
		throw new RangeError(
			`TokenId value ${tokenId} exceeds Number.MAX_SAFE_INTEGER`,
		);
	}
	return Number(tokenId);
}
