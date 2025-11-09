import { fromBytes } from "./fromBytes.js";

/**
 * Create zero-filled hex of specific size
 *
 * @param {number} size - Size in bytes
 * @returns {import('./BrandedHex.js').BrandedHex} Zero-filled hex string
 *
 * @example
 * ```typescript
 * Hex.zero(4); // '0x00000000'
 * ```
 */
export function zero(size) {
	return /** @type {import('./BrandedHex.js').BrandedHex} */ (
		fromBytes(new Uint8Array(size))
	);
}
