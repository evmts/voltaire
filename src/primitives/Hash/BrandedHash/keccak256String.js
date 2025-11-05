import { keccak256 } from "./keccak256.js";

/**
 * Hash string with Keccak-256
 *
 * @param {string} str - String to hash (UTF-8 encoded)
 * @returns {import('./BrandedHash.js').BrandedHash} 32-byte hash
 *
 * @example
 * ```js
 * const hash = Hash.keccak256String('hello');
 * ```
 */
export function keccak256String(str) {
	const encoder = new TextEncoder();
	return keccak256(encoder.encode(str));
}
