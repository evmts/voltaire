import { keccak_256 } from "@noble/hashes/sha3.js";

/**
 * Hash data with Keccak-256
 *
 * @param {Uint8Array} data - Data to hash
 * @returns {import('../../primitives/Hash/index.js').BrandedHash} 32-byte hash
 *
 * @example
 * ```typescript
 * const hash = Keccak256.hash(data);
 * ```
 */
export function hash(data) {
	return /** @type {import('../../primitives/Hash/index.js').BrandedHash} */ (keccak_256(data));
}
