/**
 * Convert Bytes2 to hex string
 *
 * @param {import('./Bytes2Type.js').Bytes2Type} bytes - Bytes2 to convert
 * @returns {import('../../Hex/index.js').HexType} Hex string
 *
 * @example
 * ```typescript
 * const hex = Bytes2.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	return /** @type {import('../../Hex/index.js').HexType} */ (
		`0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`
	);
}
