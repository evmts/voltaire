/**
 * Convert MultiTokenId to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/multi-token-id for MultiTokenId documentation
 * @since 0.0.0
 * @param {import('./MultiTokenIdType.js').MultiTokenIdType} tokenId - MultiTokenId value to convert
 * @returns {import('../Hex/HexType.js').HexType} Hex string with 0x prefix
 * @example
 * ```javascript
 * import * as MultiTokenId from './primitives/MultiTokenId/index.js';
 * const tokenId = MultiTokenId.from(1n);
 * const hex = MultiTokenId.toHex(tokenId); // "0x1"
 * ```
 */
export function toHex(tokenId) {
	return /** @type {import('../Hex/HexType.js').HexType} */ (
		`0x${tokenId.toString(16)}`
	);
}
