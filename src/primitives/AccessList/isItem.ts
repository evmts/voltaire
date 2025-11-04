import type { Item } from "./BrandedAccessList.js";

/**
 * Type guard: Check if value is AccessListItem
 *
 * @param value - Value to check
 * @returns true if value is AccessListItem
 *
 * @example
 * ```typescript
 * if (AccessList.isItem(value)) {
 *   console.log(value.address, value.storageKeys);
 * }
 * ```
 */
export function isItem(value: unknown): value is Item {
	if (typeof value !== "object" || value === null) return false;
	const item = value as Partial<Item>;
	return (
		item.address instanceof Uint8Array &&
		item.address.length === 20 &&
		Array.isArray(item.storageKeys) &&
		item.storageKeys.every(
			(key) => key instanceof Uint8Array && key.length === 32,
		)
	);
}
