import * as OxHex from "ox/Hex";
import { fromBytes } from "./fromBytes.js";

/**
 * Slice hex string
 *
 * @param {string} hex - Hex string to slice
 * @param {number} start - Start byte index
 * @param {number} [end] - End byte index (optional)
 * @returns {string} Sliced hex string
 *
 * @example
 * ```typescript
 * const hex = Hex('0x123456');
 * const sliced1 = Hex.slice(hex, 1); // '0x3456'
 * const sliced2 = hex.slice(1); // '0x3456'
 * ```
 */
export function slice(hex, start, end) {
	const bytes = OxHex.toBytes(hex);
	return fromBytes(bytes.slice(start, end));
}
