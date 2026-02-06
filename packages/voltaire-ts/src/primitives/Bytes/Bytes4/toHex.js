/**
 * Convert Bytes4 to hex string
 *
 * @param {import('./Bytes4Type.js').Bytes4Type} bytes - Bytes4 to convert
 * @returns {import('../../Hex/index.js').HexType} Hex string
 *
 * @example
 * ```typescript
 * const hex = Bytes4.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	return /** @type {import('../../Hex/index.js').HexType} */ (
		`0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`
	);
}
