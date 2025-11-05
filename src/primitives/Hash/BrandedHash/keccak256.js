import { keccak_256 } from "@noble/hashes/sha3.js";

/**
 * Hash data with Keccak-256
 *
 * @param {Uint8Array} data - Data to hash
 * @returns {import('./BrandedHash.js').BrandedHash} 32-byte hash
 *
 * @example
 * ```js
 * const hash = Hash.keccak256(data);
 * ```
 */
export function keccak256(data) {
	return /** @type {import('./BrandedHash.ts').BrandedHash} */ (
		keccak_256(data)
	);
}
