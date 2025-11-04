import type { BrandedAddress } from "../Address/index.js";
import type { BrandedHash } from "../Hash/index.js";
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
 * Get all storage keys for an address
 *
 * @param list - Access list to search
 * @param address - Address to get keys for
 * @returns Array of storage keys, or undefined if address not found
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [key1, key2] }]);
 * const keys = AccessList.keysFor(list, address); // Static call
 * const keys2 = list.keysFor(address); // Instance call
 * if (keys) {
 *   console.log(`Found ${keys.length} storage keys`);
 * }
 * ```
 */
export function keysFor(
	list: BrandedAccessList,
	address: BrandedAddress,
): readonly BrandedHash[] | undefined {
	for (const item of list) {
		if (addressEquals(item.address, address)) {
			return item.storageKeys;
		}
	}
	return undefined;
}
