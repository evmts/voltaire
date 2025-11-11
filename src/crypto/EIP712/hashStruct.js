import { keccak_256 } from "@noble/hashes/sha3.js";
import { encodeData } from "./encodeData.js";

/**
 * Hash struct according to EIP-712 specification.
 *
 * Computes keccak256 of the encoded struct data.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} primaryType - Type name of the struct
 * @param {import('./BrandedEIP712.js').Message} data - Message data to hash
 * @param {import('./BrandedEIP712.js').TypeDefinitions} types - Type definitions mapping
 * @returns {import('../../primitives/Hash/index.js').BrandedHash} 32-byte struct hash
 * @throws {Eip712TypeNotFoundError} If type is not found
 * @throws {Eip712InvalidMessageError} If message data is invalid
 * @example
 * ```javascript
 * import * as EIP712 from './crypto/EIP712/index.js';
 * const types = { Person: [{ name: 'name', type: 'string' }] };
 * const hash = EIP712.hashStruct('Person', { name: 'Alice' }, types);
 * ```
 */
export function hashStruct(primaryType, data, types) {
	const encoded = encodeData(primaryType, data, types);
	return /** @type {import('../../primitives/Hash/index.js').BrandedHash} */ (
		keccak_256(encoded)
	);
}
