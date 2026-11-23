import { encodeHexDigits } from "../../Hex/encodeHexDigits.js";

/**
 * Convert Bytes6 to hex string
 *
 * @param {import('./Bytes6Type.js').Bytes6Type} bytes - Bytes6 to convert
 * @returns {import('../../Hex/index.js').HexType} Hex string
 *
 * @example
 * ```typescript
 * const hex = Bytes6.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	return /** @type {import('../../Hex/index.js').HexType} */ (
		`0x${encodeHexDigits(bytes)}`
	);
}
