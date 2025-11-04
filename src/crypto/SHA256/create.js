import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js";

/**
 * Incremental hasher for streaming data
 *
 * @returns {{ update: (data: Uint8Array) => void, digest: () => Uint8Array }} Hasher instance
 *
 * @example
 * ```typescript
 * const hasher = SHA256.create();
 * hasher.update(chunk1);
 * hasher.update(chunk2);
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
