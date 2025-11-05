import { includesAddress } from "./includesAddress.js";

/**
 * Add address to access list (EIP-2930)
 *
 * Creates new entry if address doesn't exist, otherwise returns original list.
 *
 * @param {import('../BrandedAccessList.js').BrandedAccessList} list - Access list to add to
 * @param {import('../../Address/BrandedAddress.js').BrandedAddress} address - Address to add
 * @returns {import('../BrandedAccessList.js').BrandedAccessList} New access list with address added
 *
 * @example
 * ```typescript
 * const list = AccessList([]);
 * const newList = AccessList.withAddress(list, address); // Static call
 * const newList2 = list.withAddress(address); // Instance call
 * ```
 */
export function withAddress(list, address) {
	if (includesAddress(list, address)) {
		return list;
	}
	return [...list, { address, storageKeys: [] }];
}
