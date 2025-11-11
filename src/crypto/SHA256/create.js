import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js";

/**
 * Incremental hasher for streaming data
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @returns {{ update: (data: Uint8Array) => void, digest: () => Uint8Array }} Hasher instance
 * @throws {never}
 * @example
 * ```javascript
 * import { SHA256 } from './crypto/SHA256/index.js';
 * const hasher = SHA256.create();
 * hasher.update(new Uint8Array([1, 2, 3]));
 * hasher.update(new Uint8Array([4, 5, 6]));
 * const hash = hasher.digest();
 * ```
 */
export function create() {
	const hasher = nobleSha256.create();
	return {
		/**
		 * Update hasher with new data
		 * @param {Uint8Array} data
		 */
		update(data) {
			hasher.update(data);
		},
		/**
		 * Finalize and get hash
		 * @returns {Uint8Array}
		 */
		digest() {
			return hasher.digest();
		},
	};
}
