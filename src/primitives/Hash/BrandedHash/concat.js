import { Keccak256 } from "./keccak256.js";

/**
 * Factory: Concatenate multiple hashes and hash the result
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(...hashes: import('./BrandedHash.ts').BrandedHash[]) => import('./BrandedHash.ts').BrandedHash} Function that concatenates and hashes
 */
export function Concat({ keccak256 }) {
	const hash = Keccak256({ keccak256 });

	/**
	 * Concatenate multiple hashes and hash the result
	 *
	 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
	 * @since 0.0.0
	 * @param {...import('./BrandedHash.ts').BrandedHash} hashes - Hashes to concatenate
	 * @returns {import('./BrandedHash.ts').BrandedHash} Hash of concatenated hashes
	 * @throws {never}
	 * @example
	 * ```javascript
	 * import { Concat } from './primitives/Hash/index.js';
	 * import { hash as keccak256 } from './crypto/Keccak256/hash.js';
	 * const concatHashes = Concat({ keccak256 });
	 * const combined = concatHashes(hash1, hash2);
	 * ```
	 */
	return function concat(...hashes) {
		const totalLength = hashes.reduce((sum, h) => sum + h.length, 0);
		const combined = new Uint8Array(totalLength);

		let offset = 0;
		for (const h of hashes) {
			combined.set(h, offset);
			offset += h.length;
		}

		return hash(combined);
	};
}
