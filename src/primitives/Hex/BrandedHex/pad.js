import * as OxHex from "ox/Hex";
import { fromBytes } from "./fromBytes.js";

/**
 * Pad hex to target size (left-padded with zeros)
 *
 * @param {string} hex - Hex string to pad
 * @param {number} targetSize - Target size in bytes
 * @returns {string} Padded hex string
 *
 * @example
 * ```typescript
 * const hex = Hex('0x1234');
 * const padded1 = Hex.pad(hex, 4); // '0x00001234'
 * const padded2 = hex.pad(4); // '0x00001234'
 * ```
 */
export function pad(hex, targetSize) {
	const bytes = OxHex.toBytes(hex);
	if (bytes.length >= targetSize) return fromBytes(bytes);
	const padded = new Uint8Array(targetSize);
	padded.set(bytes, targetSize - bytes.length);
	return fromBytes(padded);
}
