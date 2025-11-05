import { encode } from "../Rlp/BrandedRlp/encode.js";
import type { BrandedAccessList } from "./BrandedAccessList.js";

/**
 * Encode access list to RLP
 *
 * @param list - Access list to encode
 * @returns RLP-encoded bytes
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
export function toBytes(list: BrandedAccessList): Uint8Array {
	// Format: [[address, [storageKey1, storageKey2, ...]], ...]
	const encoded = list.map((item) => [
		item.address,
		item.storageKeys.map((key) => key as Uint8Array),
	]);
	return encode(encoded);
}
