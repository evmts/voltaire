import { encodeHexDigits } from "../../Hex/encodeHexDigits.js";

/**
 * Convert Bytes5 to hex string
 *
 * @param {import('./Bytes5Type.js').Bytes5Type} bytes - Bytes5 to convert
 * @returns {import('../../Hex/index.js').HexType} Hex string
 *
 * @example
 * ```typescript
 * const hex = Bytes5.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	return /** @type {import('../../Hex/index.js').HexType} */ (
		`0x${encodeHexDigits(bytes)}`
	);
}
