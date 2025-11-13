/**
 * Factory: Hash struct according to EIP-712 specification.
 *
 * Computes keccak256 of the encoded struct data.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(primaryType: string, data: import('./BrandedEIP712.js').Message, types: import('./BrandedEIP712.js').TypeDefinitions) => Uint8Array} deps.encodeData - Encode data function
 * @returns {(primaryType: string, data: import('./BrandedEIP712.js').Message, types: import('./BrandedEIP712.js').TypeDefinitions) => import('../../primitives/Hash/index.js').BrandedHash} Function that hashes struct
 * @throws {Eip712TypeNotFoundError} If type is not found
 * @throws {Eip712InvalidMessageError} If message data is invalid
 * @example
 * ```javascript
 * import { HashStruct } from './crypto/EIP712/hashStruct.js';
 * import { hash as keccak256 } from '../Keccak256/hash.js';
 * import { EncodeData } from './encodeData.js';
 * const encodeData = EncodeData({ hashType, encodeValue });
 * const hashStruct = HashStruct({ keccak256, encodeData });
 * const types = { Person: [{ name: 'name', type: 'string' }] };
 * const hash = hashStruct('Person', { name: 'Alice' }, types);
 * ```
 */
export function HashStruct({ keccak256, encodeData }) {
	return function hashStruct(primaryType, data, types) {
		const encoded = encodeData(primaryType, data, types);
		return /** @type {import('../../primitives/Hash/index.js').BrandedHash} */ (
			keccak256(encoded)
		);
	};
}
