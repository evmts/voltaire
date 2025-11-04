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
 * Compare two hashes for equality (byte-by-byte)
 */
function hashEquals(a: BrandedHash, b: BrandedHash): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

/**
 * Check if storage key is in access list for given address
 *
 * @param list - Access list to search
 * @param address - Address to check
 * @param storageKey - Storage key to find
 * @returns true if storage key is accessible
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [key] }]);
 * const isAccessible = AccessList.includesStorageKey(list, address, key); // Static call
 * const isAccessible2 = list.includesStorageKey(address, key); // Instance call
 * ```
 */
export function includesStorageKey(
	list: BrandedAccessList,
	address: BrandedAddress,
	storageKey: BrandedHash,
): boolean {
	for (const item of list) {
		if (addressEquals(item.address, address)) {
			for (const key of item.storageKeys) {
				if (hashEquals(key, storageKey)) {
					return true;
				}
			}
		}
	}
	return false;
}
