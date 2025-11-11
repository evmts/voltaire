import { keccak_256 } from "@noble/hashes/sha3.js";

/**
 * Hash data with Keccak-256
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} data - Data to hash
 * @returns {import('../../primitives/Hash/index.js').BrandedHash} 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import * as Keccak256 from './crypto/Keccak256/index.js';
 * const hash = Keccak256.hash(data);
 * ```
 */
export function hash(data) {
	return /** @type {import('../../primitives/Hash/index.js').BrandedHash} */ (
		keccak_256(data)
	);
}
