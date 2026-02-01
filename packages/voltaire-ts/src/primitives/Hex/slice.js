import { fromBytes } from "./fromBytes.js";
import { toBytes } from "./toBytes.js";

/**
 * Slice hex string. Supports negative indices like Array.slice().
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} hex - Hex string to slice
 * @param {number} start - Start byte index (negative counts from end: -1 = last byte)
 * @param {number} [end] - End byte index (negative counts from end: -1 = last byte, exclusive)
 * @returns {string} Sliced hex string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234567890');
 * Hex.slice(hex, 1);      // '0x34567890' - from byte 1 to end
 * Hex.slice(hex, -2);     // '0x7890' - last 2 bytes
 * Hex.slice(hex, 1, -1);  // '0x345678' - byte 1 to second-to-last
 * ```
 */
export function slice(hex, start, end) {
	const bytes = toBytes(/** @type {import('./HexType.js').HexType} */ (hex));
	return /** @type {import('./HexType.js').HexType} */ (
		fromBytes(bytes.slice(start, end))
	);
}
