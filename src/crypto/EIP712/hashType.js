import { keccak_256 } from "@noble/hashes/sha3.js";
import { encodeType } from "./encodeType.js";

/**
 * Hash type string according to EIP-712.
 *
 * Computes keccak256 of the encoded type string.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} primaryType - Primary type name to hash
 * @param {import('./BrandedEIP712.js').TypeDefinitions} types - Type definitions mapping
 * @returns {import('../../primitives/Hash/index.js').BrandedHash} 32-byte type hash
 * @throws {Eip712TypeNotFoundError} If type is not found
 * @example
 * ```javascript
 * import * as EIP712 from './crypto/EIP712/index.js';
 * const types = { Mail: [{ name: 'contents', type: 'string' }] };
 * const typeHash = EIP712.hashType('Mail', types);
 * ```
 */
export function hashType(primaryType, types) {
	const encoded = encodeType(primaryType, types);
	const encodedBytes = new TextEncoder().encode(encoded);
	return /** @type {import('../../primitives/Hash/index.js').BrandedHash} */ (
		keccak_256(encodedBytes)
	);
}
