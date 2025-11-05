import { fromBytes } from "./fromBytes.js";

/**
 * Create zero-filled hex of specific size
 *
 * @param {number} size - Size in bytes
 * @returns {string} Zero-filled hex string
 *
 * @example
 * ```typescript
 * Hex.zero(4); // '0x00000000'
 * ```
 */
export function zero(size) {
	return fromBytes(new Uint8Array(size));
}
