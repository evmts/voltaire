import { keccak_256 } from "@noble/hashes/sha3.js";
import { hash as hashDomain } from "./Domain/hash.js";
import { hashStruct } from "./hashStruct.js";

/**
 * Hash typed data according to EIP-712
 *
 * Computes: keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct(message))
 *
 * @param {import('./BrandedEIP712.js').TypedData} typedData - Complete typed data structure
 * @returns {import('../../primitives/Hash/index.js').BrandedHash} EIP-712 hash
 *
 * @example
 * ```typescript
 * const hash = EIP712.hashTypedData(typedData);
 * ```
 */
export function hashTypedData(typedData) {
	// Hash domain separator
	const domainHash = hashDomain(typedData.domain);

	// Hash message struct
	const messageHash = hashStruct(
		typedData.primaryType,
		typedData.message,
		typedData.types,
	);

	// EIP-712 prefix + domain + message
	const prefix = new Uint8Array([0x19, 0x01]);
	const combined = new Uint8Array(2 + 32 + 32);
	combined.set(prefix, 0);
	combined.set(domainHash, 2);
	combined.set(messageHash, 34);

	return /** @type {import('../../primitives/Hash/index.js').BrandedHash} */ (
		keccak_256(combined)
	);
}
