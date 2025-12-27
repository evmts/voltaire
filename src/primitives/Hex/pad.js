import { fromBytes } from "./fromBytes.js";
import { toBytes } from "./toBytes.js";

/**
 * Pad hex to target size (left-padded with zeros)
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} hex - Hex string to pad
 * @param {number} targetSize - Target size in bytes
 * @returns {string} Padded hex string
 * @throws {Error} If hex exceeds target size
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const padded = Hex.pad(hex, 4); // '0x00001234'
 * Hex.pad('0x1234', 1); // throws Error (2 bytes > 1 byte target)
 * ```
 */
export function pad(hex, targetSize) {
	const bytes = toBytes(/** @type {import('./HexType.js').HexType} */ (hex));
	if (bytes.length > targetSize) {
		throw new Error(
			`Hex size (${bytes.length} bytes) exceeds padding size (${targetSize} bytes).`,
		);
	}
	if (bytes.length === targetSize) {
		return /** @type {import('./HexType.js').HexType} */ (fromBytes(bytes));
	}
	const padded = new Uint8Array(targetSize);
	padded.set(bytes, targetSize - bytes.length);
	return /** @type {import('./HexType.js').HexType} */ (fromBytes(padded));
}
