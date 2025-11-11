import { keccak_256 } from "@noble/hashes/sha3.js";

/**
 * Hash data with Keccak-256
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {Uint8Array} data - Data to hash
 * @returns {import('./BrandedHash.js').BrandedHash} 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.keccak256(data);
 * ```
 */
export function keccak256(data) {
	return /** @type {import('./BrandedHash.ts').BrandedHash} */ (
		keccak_256(data)
	);
}
