/**
 * Type guard: Check if value is AccessListItem (EIP-2930)
 *
 * @param {unknown} value - Value to check
 * @returns {value is import('./BrandedAccessList.js').Item} true if value is AccessListItem
 *
 * @example
 * ```typescript
 * if (AccessList.isItem(value)) {
 *   console.log(value.address, value.storageKeys);
 * }
 * ```
 */
export function isItem(value) {
	if (typeof value !== "object" || value === null) return false;
	const item = value;
	return (
		item.address instanceof Uint8Array &&
		item.address.length === 20 &&
		Array.isArray(item.storageKeys) &&
		item.storageKeys.every(
			(key) => key instanceof Uint8Array && key.length === 32,
		)
	);
}
