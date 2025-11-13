import { encodeType } from "./encodeType.js";

/**
 * Factory: Hash type string according to EIP-712.
 *
 * Computes keccak256 of the encoded type string.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(primaryType: string, types: import('./BrandedEIP712.js').TypeDefinitions) => import('../../primitives/Hash/index.js').BrandedHash} Function that hashes type string
 * @throws {Eip712TypeNotFoundError} If type is not found
 * @example
 * ```javascript
 * import { HashType } from './crypto/EIP712/hashType.js';
 * import { hash as keccak256 } from '../Keccak256/hash.js';
 * const hashType = HashType({ keccak256 });
 * const types = { Mail: [{ name: 'contents', type: 'string' }] };
 * const typeHash = hashType('Mail', types);
 * ```
 */
export function HashType({ keccak256 }) {
	return function hashType(primaryType, types) {
		const encoded = encodeType(primaryType, types);
		const encodedBytes = new TextEncoder().encode(encoded);
		return /** @type {import('../../primitives/Hash/index.js').BrandedHash} */ (
			keccak256(encodedBytes)
		);
	};
}
