/**
 * Factory: Hash data with Keccak-256
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(data: Uint8Array) => import('./BrandedHash.js').BrandedHash} Function that hashes data
 */
export function Keccak256({ keccak256 }) {
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
	 * import { Keccak256 } from './primitives/Hash/index.js';
	 * import { hash as keccak256 } from './crypto/Keccak256/hash.js';
	 * const hashData = Keccak256({ keccak256 });
	 * const hash = hashData(data);
	 * ```
	 */
	return function hash(data) {
		return /** @type {import('./BrandedHash.ts').BrandedHash} */ (
			keccak256(data)
		);
	};
}
