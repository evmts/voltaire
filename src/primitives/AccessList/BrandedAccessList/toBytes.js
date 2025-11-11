import { encode } from "../../Rlp/BrandedRlp/encode.js";

/**
 * Encode access list to RLP (EIP-2930)
 *
 * Format: [[address, [storageKey1, storageKey2, ...]], ...]
 *
 * @see https://voltaire.tevm.sh/primitives/accesslist
 * @since 0.0.0
 * @param {import('../BrandedAccessList.js').BrandedAccessList} list - Access list to encode
 * @returns {Uint8Array} RLP-encoded bytes
 * @throws {never}
 * @example
 * ```javascript
 * import * as AccessList from './primitives/AccessList/index.js';
 * const list = AccessList.from([{ address: '0x742d35Cc...', storageKeys: [] }]);
 * const encoded = AccessList.toBytes(list);
 * ```
 */
export function toBytes(list) {
	// Format: [[address, [storageKey1, storageKey2, ...]], ...]
	const encoded = list.map((item) => [
		item.address,
		item.storageKeys.map((key) => key),
	]);
	return encode(encoded);
}
