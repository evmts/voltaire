import { Keccak256 } from "./keccak256.js";

/**
 * Factory: Hash string with Keccak-256
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(str: string) => import('./BrandedHash.js').BrandedHash} Function that hashes strings
 */
export function Keccak256String({ keccak256 }) {
	const hash = Keccak256({ keccak256 });

	/**
	 * Hash string with Keccak-256
	 *
	 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
	 * @since 0.0.0
	 * @param {string} str - String to hash (UTF-8 encoded)
	 * @returns {import('./BrandedHash.js').BrandedHash} 32-byte hash
	 * @throws {never}
	 * @example
	 * ```javascript
	 * import { Keccak256String } from './primitives/Hash/index.js';
	 * import { hash as keccak256 } from './crypto/Keccak256/hash.js';
	 * const hashString = Keccak256String({ keccak256 });
	 * const result = hashString('hello');
	 * ```
	 */
	return function keccak256String(str) {
		const encoder = new TextEncoder();
		return hash(encoder.encode(str));
	};
}
