import { fromBytes } from "./fromBytes.js";

/**
 * Convert string to hex
 *
 * @param {string} str - String to convert
 * @returns {import('./BrandedHex.js').BrandedHex} Hex string
 *
 * @example
 * ```typescript
 * Hex.fromString('hello'); // '0x68656c6c6f'
 * ```
 */
export function fromString(str) {
	const encoder = new TextEncoder();
	return fromBytes(encoder.encode(str));
}
