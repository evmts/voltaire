import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import type { BrandedHash } from "../Hash/Hash.js";
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
function hashEquals(a: BrandedHash, b: BrandedHash): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

/**
 * Deduplicate access list entries
 *
 * Merges duplicate addresses and removes duplicate storage keys.
 *
 * @param list - Access list to deduplicate
 * @returns Deduplicated access list
 *
 * @example
 * ```typescript
 * const list = AccessList([
 *   { address: addr1, storageKeys: [key1] },
 *   { address: addr1, storageKeys: [key2, key1] },
 * ]);
 * const deduped = AccessList.deduplicate(list); // Static call
 * const deduped2 = list.deduplicate(); // Instance call
 * // Result: [{ address: addr1, storageKeys: [key1, key2] }]
 * ```
 */
export function deduplicate(list: BrandedAccessList): BrandedAccessList {
	const result: Item[] = [];

	for (const item of list) {
		// Find existing entry with same address
		const existing = result.find((r) => addressEquals(r.address, item.address));

		if (existing) {
			// Merge storage keys, avoiding duplicates
			const existingKeys = existing.storageKeys as BrandedHash[];
			for (const newKey of item.storageKeys) {
				const isDuplicate = existingKeys.some((existingKey) =>
					hashEquals(existingKey, newKey),
				);
				if (!isDuplicate) {
					existingKeys.push(newKey);
				}
			}
		} else {
			// Create new entry
			result.push({
				address: item.address,
				storageKeys: [...item.storageKeys],
			});
		}
	}

	return result as BrandedAccessList;
}
