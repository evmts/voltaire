import { fromBytes } from "./fromBytes.js";

/**
 * Generate random hex of specific size
 *
 * @param {number} size - Size in bytes
 * @returns {string} Random hex string
 *
 * @example
 * ```typescript
 * const random = Hex.random(32); // random 32-byte hex
 * ```
 */
export function random(size) {
	const bytes = new Uint8Array(size);
	crypto.getRandomValues(bytes);
	return fromBytes(bytes);
}
