import { keccak_256 } from "@noble/hashes/sha3.js";

/**
 * Hash data with Keccak-256
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} data - Data to hash
 * @returns {import('./Keccak256HashType.js').Keccak256Hash} 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { Keccak256Hash } from './crypto/Keccak256/index.js';
 * const hash = Keccak256Hash.from(data);
 * ```
 */
export function hash(data) {
	return /** @type {import('./Keccak256HashType.js').Keccak256Hash} */ (
		keccak_256(data)
	);
}
