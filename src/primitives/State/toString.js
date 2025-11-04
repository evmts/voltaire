import { from } from "./from.js";

/**
 * Convert StorageKey to a string representation for use as Map key
 *
 * The string format is: address_hex + "_" + slot_hex
 *
 * @param {import('./BrandedStorageKey.js').StorageKeyLike} key - Storage key to convert
 * @returns {string} String representation
 *
 * @example
 * ```typescript
 * const key = { address: addr, slot: 42n };
 * const str = StorageKey.toString(key);
 * // Use as Map key
 * map.set(str, value);
 * ```
 */
export function toString(key) {
	const storageKey = from(key);
	const addrHex = Array.from(storageKey.address)
		.map((b) => (b ?? 0).toString(16).padStart(2, "0"))
		.join("");
	const slotHex = storageKey.slot.toString(16).padStart(64, "0");
	return `${addrHex}_${slotHex}`;
}
