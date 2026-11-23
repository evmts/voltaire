import { encodeHexDigits } from "../../Hex/encodeHexDigits.js";

/**
 * Convert Bytes3 to hex string
 *
 * @param {import('./Bytes3Type.js').Bytes3Type} bytes - Bytes3 to convert
 * @returns {import('../../Hex/index.js').HexType} Hex string
 *
 * @example
 * ```typescript
 * const hex = Bytes3.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	return /** @type {import('../../Hex/index.js').HexType} */ (
		`0x${encodeHexDigits(bytes)}`
	);
}
