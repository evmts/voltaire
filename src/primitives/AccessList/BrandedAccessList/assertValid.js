import { isItem } from "./isItem.js";

/**
 * Validate access list structure (EIP-2930)
 *
 * @param {import('../BrandedAccessList.js').BrandedAccessList} list - Access list to validate
 * @throws {Error} If invalid
 *
 * @example
 * ```typescript
 * try {
 *   AccessList.assertValid(list);
 *   console.log('Valid access list');
 * } catch (err) {
 *   console.error('Invalid:', err.message);
 * }
 * ```
 */
export function assertValid(list) {
	if (!Array.isArray(list)) {
		throw new Error("Access list must be an array");
	}

	for (const item of list) {
		if (!isItem(item)) {
			throw new Error("Invalid access list item");
		}

		// Validate address
		if (!(item.address instanceof Uint8Array) || item.address.length !== 20) {
			throw new Error("Invalid address in access list");
		}

		// Validate storage keys
		for (const key of item.storageKeys) {
			if (!(key instanceof Uint8Array) || key.length !== 32) {
				throw new Error("Invalid storage key in access list");
			}
		}
	}
}
