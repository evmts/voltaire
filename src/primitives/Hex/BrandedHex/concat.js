import * as OxHex from "ox/Hex";
import { fromBytes } from "./fromBytes.js";

/**
 * Concatenate multiple hex strings
 *
 * @param {...string} hexes - Hex strings to concatenate
 * @returns {string} Concatenated hex string
 *
 * @example
 * ```typescript
 * Hex.concat('0x12', '0x34', '0x56'); // '0x123456'
 * ```
 */
export function concat(...hexes) {
	const allBytes = hexes.flatMap((h) =>
		Array.from(OxHex.toBytes(/** @type {`0x${string}`} */ (h))),
	);
	return /** @type {import('./BrandedHex.js').BrandedHex} */ (
		fromBytes(new Uint8Array(allBytes))
	);
}
