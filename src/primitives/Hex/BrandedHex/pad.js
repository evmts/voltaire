import * as OxHex from "ox/Hex";
import { fromBytes } from "./fromBytes.js";

/**
 * Pad hex to target size (left-padded with zeros)
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} hex - Hex string to pad
 * @param {number} targetSize - Target size in bytes
 * @returns {string} Padded hex string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const padded = Hex.pad(hex, 4); // '0x00001234'
 * ```
 */
export function pad(hex, targetSize) {
	const bytes = OxHex.toBytes(/** @type {`0x${string}`} */ (hex));
	if (bytes.length >= targetSize) {
		return /** @type {import('./BrandedHex.js').BrandedHex} */ (
			fromBytes(bytes)
		);
	}
	const padded = new Uint8Array(targetSize);
	padded.set(bytes, targetSize - bytes.length);
	return /** @type {import('./BrandedHex.js').BrandedHex} */ (
		fromBytes(padded)
	);
}
