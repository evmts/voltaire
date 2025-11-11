import * as OxHex from "ox/Hex";
import { fromBytes } from "./fromBytes.js";

/**
 * Pad hex to right (suffix with zeros)
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} hex - Hex string to pad
 * @param {number} targetSize - Target size in bytes
 * @returns {string} Right-padded hex string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const padded = Hex.padRight(hex, 4); // '0x12340000'
 * ```
 */
export function padRight(hex, targetSize) {
	const bytes = OxHex.toBytes(/** @type {`0x${string}`} */ (hex));
	if (bytes.length >= targetSize) {
		return /** @type {import('./BrandedHex.js').BrandedHex} */ (
			fromBytes(bytes)
		);
	}
	const padded = new Uint8Array(targetSize);
	padded.set(bytes, 0);
	return /** @type {import('./BrandedHex.js').BrandedHex} */ (
		fromBytes(padded)
	);
}
