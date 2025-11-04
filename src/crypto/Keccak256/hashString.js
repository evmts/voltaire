import { hash } from "./hash.js";

/**
 * Hash string with Keccak-256
 *
 * String is UTF-8 encoded before hashing.
 *
 * @param {string} str - String to hash
 * @returns {import('../../primitives/Hash/index.js').BrandedHash} 32-byte hash
 *
 * @example
 * ```typescript
 * const hash = Keccak256.hashString('hello');
 * ```
 */
export function hashString(str) {
	const encoder = new TextEncoder();
	return hash(encoder.encode(str));
}
