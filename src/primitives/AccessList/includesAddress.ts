import type { BrandedAddress } from "../Address/index.js";
import type { BrandedAccessList } from "./BrandedAccessList.js";

/**
 * Compare two addresses for equality (byte-by-byte)
 */
function addressEquals(a: BrandedAddress, b: BrandedAddress): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

/**
 * Check if address is in access list
 *
 * @param list - Access list to search
 * @param address - Address to find
 * @returns true if address is in access list
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [] }]);
 * const hasAddress = AccessList.includesAddress(list, address); // Static call
 * const hasAddress2 = list.includesAddress(address); // Instance call
 * ```
 */
export function includesAddress(
	list: BrandedAccessList,
	address: BrandedAddress,
): boolean {
	for (const item of list) {
		if (addressEquals(item.address, address)) {
			return true;
		}
	}
	return false;
}
