import { toHex } from "./toHex.js";

/**
 * Convert Hash to string representation
 *
 * @param {import('./BrandedHash.ts').BrandedHash} hash - Hash to convert
 * @returns {string} Hex string with 0x prefix
 *
 * @example
 * ```js
 * const hash = Hash.from('0x1234...');
 * const str = Hash.toString(hash); // "0x1234..."
 * ```
 */
export function toString(hash) {
	return toHex(hash);
}
