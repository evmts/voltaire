import { keccak_256 } from "@noble/hashes/sha3.js";
import { encodeType } from "./encodeType.js";

/**
 * Hash type string
 *
 * @param {string} primaryType - Primary type name
 * @param {import('./BrandedEIP712.js').TypeDefinitions} types - Type definitions
 * @returns {import('../../primitives/Hash/index.js').BrandedHash} Type hash
 *
 * @example
 * ```typescript
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
