import type { BrandedAddress } from "../Address/index.js";
import type { BrandedAccessList } from "./BrandedAccessList.js";
import { includesAddress } from "./includesAddress.js";

/**
 * Add address to access list
 *
 * Creates new entry if address doesn't exist, otherwise returns original list.
 *
 * @param list - Access list to add to
 * @param address - Address to add
 * @returns New access list with address added
 *
 * @example
 * ```typescript
 * const list = AccessList([]);
 * const newList = AccessList.withAddress(list, address); // Static call
 * const newList2 = list.withAddress(address); // Instance call
 * ```
 */
export function withAddress(
	list: BrandedAccessList,
	address: BrandedAddress,
): BrandedAccessList {
	if (includesAddress(list, address)) {
		return list;
	}
	return [...list, { address, storageKeys: [] }] as BrandedAccessList;
}
