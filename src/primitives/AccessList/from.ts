import type { BrandedAccessList, Item } from "./BrandedAccessList.js";
import { fromBytes } from "./fromBytes.js";

/**
 * Create AccessList from array or bytes
 *
 * @param value - AccessList items or RLP bytes
 * @returns AccessList
 *
 * @example
 * ```typescript
 * const list = AccessList.from([{ address, storageKeys: [] }]);
 * const list2 = AccessList.from(bytes); // from RLP bytes
 * ```
 */
export function from(value: readonly Item[] | Uint8Array): BrandedAccessList {
	if (value instanceof Uint8Array) {
		return fromBytes(value);
	}
	return value as BrandedAccessList;
}
