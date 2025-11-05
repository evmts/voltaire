import { keccak_256 } from "@noble/hashes/sha3.js";
import { encodeData } from "./encodeData.js";

/**
 * Hash struct according to EIP-712
 *
 * @param {string} primaryType - Type name
 * @param {import('./BrandedEIP712.js').Message} data - Message data
 * @param {import('./BrandedEIP712.js').TypeDefinitions} types - Type definitions
 * @returns {import('../../primitives/Hash/index.js').BrandedHash} Struct hash
 *
 * @example
 * ```typescript
 * const hash = EIP712.hashStruct('Person', { name: 'Alice', wallet: '0x...' }, types);
 * ```
 */
export function hashStruct(primaryType, data, types) {
	const encoded = encodeData(primaryType, data, types);
	return /** @type {import('../../primitives/Hash/index.js').BrandedHash} */ (
		keccak_256(encoded)
	);
}
