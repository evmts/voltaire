/**
 * Factory: Hash typed data according to EIP-712 specification.
 *
 * Computes: keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct(message))
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(domain: import('./BrandedEIP712.js').Domain) => import('../../primitives/Hash/index.js').BrandedHash} deps.hashDomain - Hash domain function
 * @param {(primaryType: string, data: import('./BrandedEIP712.js').Message, types: import('./BrandedEIP712.js').TypeDefinitions) => import('../../primitives/Hash/index.js').BrandedHash} deps.hashStruct - Hash struct function
 * @returns {(typedData: import('./BrandedEIP712.js').TypedData) => import('../../primitives/Hash/index.js').BrandedHash} Function that hashes typed data
 * @throws {Eip712TypeNotFoundError} If types are not found
 * @throws {Eip712InvalidMessageError} If message data is invalid
 * @example
 * ```javascript
 * import { HashTypedData } from './crypto/EIP712/hashTypedData.js';
 * import { hash as keccak256 } from '../Keccak256/hash.js';
 * import { Hash as HashDomain } from './Domain/hash.js';
 * import { HashStruct } from './hashStruct.js';
 * const hashDomain = HashDomain({ hashStruct });
 * const hashStruct = HashStruct({ keccak256, encodeData });
 * const hashTypedData = HashTypedData({ keccak256, hashDomain, hashStruct });
 * const hash = hashTypedData(typedData);
 * ```
 */
export function HashTypedData({ keccak256, hashDomain, hashStruct }) {
	return function hashTypedData(typedData) {
		// Hash domain separator
		const domainSeparator = hashDomain(typedData.domain);

		// Hash message struct
		const messageHash = hashStruct(
			typedData.primaryType,
			typedData.message,
			typedData.types,
		);

		// Concatenate: 0x19 0x01 ‖ domainSeparator ‖ messageHash
		const data = new Uint8Array(2 + 32 + 32);
		data[0] = 0x19;
		data[1] = 0x01;
		data.set(domainSeparator, 2);
		data.set(messageHash, 34);

		return /** @type {import('../../primitives/Hash/index.js').BrandedHash} */ (
			keccak256(data)
		);
	};
}
