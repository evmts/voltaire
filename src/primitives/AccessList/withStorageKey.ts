import type { BrandedAddress } from "../Address/index.js";
import { Hash, type BrandedHash } from "../Hash/index.js";
import type { BrandedAccessList, Item } from "./BrandedAccessList.js";

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
function hashEquals(a: BrandedHash, b: Hash): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

/**
 * Add storage key to access list for address
 *
 * Adds address if it doesn't exist, then adds storage key if not already present.
 *
 * @param list - Access list to add to
 * @param address - Address to add key for
 * @param storageKey - Storage key to add
 * @returns New access list with storage key added
 *
 * @example
 * ```typescript
 * const list = AccessList([]);
 * const newList = AccessList.withStorageKey(list, address, key); // Static call
 * const newList2 = list.withStorageKey(address, key); // Instance call
 * ```
 */
export function withStorageKey(
	list: BrandedAccessList,
	address: BrandedAddress,
	storageKey: BrandedHash,
): BrandedAccessList {
	const result: Item[] = [];
	let found = false;

	for (const item of list) {
		if (addressEquals(item.address, address)) {
			found = true;
			// Check if key already exists
			const hasKey = item.storageKeys.some((k) => hashEquals(k, storageKey));
			if (hasKey) {
				result.push(item);
			} else {
				result.push({
					address: item.address,
					storageKeys: [...item.storageKeys, storageKey],
				});
			}
		} else {
			result.push(item);
		}
	}

	// If address not found, add new entry
	if (!found) {
		result.push({ address, storageKeys: [storageKey] });
	}

	return result as BrandedAccessList;
}
