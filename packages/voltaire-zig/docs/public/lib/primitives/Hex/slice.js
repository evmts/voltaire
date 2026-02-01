import { fromBytes } from "./fromBytes.js";
import { toBytes } from "./toBytes.js";

/**
 * Slice hex string
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} hex - Hex string to slice
 * @param {number} start - Start byte index
 * @param {number} [end] - End byte index (optional)
 * @returns {string} Sliced hex string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x123456');
 * const sliced = Hex.slice(hex, 1); // '0x3456'
 * ```
 */
export function slice(hex, start, end) {
	const bytes = toBytes(/** @type {import('./HexType.js').HexType} */ (hex));
	return /** @type {import('./HexType.js').HexType} */ (
		fromBytes(bytes.slice(start, end))
	);
}
