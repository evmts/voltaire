import { fromBytes } from "./fromBytes.js";

/**
 * Create AccessList from array or bytes (EIP-2930)
 *
 * @param {readonly import('../BrandedAccessList.js').Item[] | Uint8Array} value - AccessList items or RLP bytes
 * @returns {import('../BrandedAccessList.js').BrandedAccessList} AccessList
 *
 * @example
 * ```typescript
 * const list = AccessList.from([{ address, storageKeys: [] }]);
 * const list2 = AccessList.from(bytes); // from RLP bytes
 * ```
 */
export function from(value) {
	if (value instanceof Uint8Array) {
		return fromBytes(value);
	}
	return value;
}
