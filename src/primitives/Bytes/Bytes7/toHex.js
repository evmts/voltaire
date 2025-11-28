/**
 * Convert Bytes7 to hex string
 *
 * @param {import('./Bytes7Type.js').Bytes7Type} bytes - Bytes7 to convert
 * @returns {import('../../Hex/index.js').HexType} Hex string
 *
 * @example
 * ```typescript
 * const hex = Bytes7.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	return /** @type {import('../../Hex/index.js').HexType} */ (
		`0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`
	);
}
