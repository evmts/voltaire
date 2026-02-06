/**
 * Convert Bytes1 to hex string
 *
 * @param {import('./Bytes1Type.js').Bytes1Type} bytes - Bytes1 to convert
 * @returns {import('../../Hex/index.js').HexType} Hex string
 *
 * @example
 * ```typescript
 * const hex = Bytes1.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	const val = /** @type {number} */ (bytes[0]);
	return /** @type {import('../../Hex/index.js').HexType} */ (
		`0x${val.toString(16).padStart(2, "0")}`
	);
}
