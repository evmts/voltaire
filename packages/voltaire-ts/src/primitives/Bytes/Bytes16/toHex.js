import { HEX_BYTE_TABLE } from "../../Hex/hexLookup.js";

/**
 * Convert Bytes16 to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {import('./Bytes16Type.js').Bytes16Type} bytes - Bytes16 to convert
 * @returns {import('../../Hex/HexType.js').HexType} Hex string with 0x prefix
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const hex = Bytes16.toHex(bytes);
 * // "0x1234567890abcdef1234567890abcdef"
 * ```
 */
export function toHex(bytes) {
	let result = "0x";
	for (let i = 0; i < bytes.length; i++) {
		const val = /** @type {number} */ (bytes[i]);
		result += HEX_BYTE_TABLE[val];
	}
	return /** @type {import('../../Hex/HexType.js').HexType} */ (result);
}
