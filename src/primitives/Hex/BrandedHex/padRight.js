import * as OxHex from "ox/Hex";
import { fromBytes } from "./fromBytes.js";

/**
 * Pad hex to right (suffix with zeros)
 *
 * @param {string} hex - Hex string to pad
 * @param {number} targetSize - Target size in bytes
 * @returns {string} Right-padded hex string
 *
 * @example
 * ```typescript
 * const hex = Hex('0x1234');
 * const padded1 = Hex.padRight(hex, 4); // '0x12340000'
 * const padded2 = hex.padRight(4); // '0x12340000'
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
