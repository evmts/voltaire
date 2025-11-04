import * as Rlp from "../Rlp/Rlp.js";

/**
 * Encode access list to RLP (EIP-2930)
 *
 * @param {import('./BrandedAccessList.js').BrandedAccessList} list - Access list to encode
 * @returns {Uint8Array} RLP-encoded bytes
 *
 * Format: [[address, [storageKey1, storageKey2, ...]], ...]
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [] }]);
 * const encoded = AccessList.toBytes(list); // Static call
 * const encoded2 = list.toBytes(); // Instance call
 * ```
 */
export function toBytes(list) {
	// Format: [[address, [storageKey1, storageKey2, ...]], ...]
	const encoded = list.map((item) => [
		item.address,
		item.storageKeys.map((key) => key),
	]);
	return Rlp.encode(encoded);
}
