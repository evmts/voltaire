import { encodeHexDigits } from "../Hex/encodeHexDigits.js";

/**
 * Convert Bytes to hex string
 *
 * @param {import('./BytesType.js').BytesType} bytes - Bytes to convert
 * @returns {import('../Hex/index.js').HexType} Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = Bytes.toHex(bytes);
 * // "0x1234"
 * ```
 */
export function toHex(bytes) {
	return /** @type {import('../Hex/index.js').HexType} */ (
		`0x${encodeHexDigits(bytes)}`
	);
}
