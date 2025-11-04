/**
 * Type guard to check if a value is a valid StorageKey
 *
 * @param {unknown} value - Value to check
 * @returns {value is import('./BrandedStorageKey.js').BrandedStorageKey} True if value is a valid StorageKey
 *
 * @example
 * ```typescript
 * const key = { address: addr, slot: 0n };
 * if (StorageKey.is(key)) {
 *   // key is StorageKey
 * }
 * ```
 */
export function is(value) {
	if (typeof value !== "object" || value === null) return false;
	const obj = value;
	return (
		obj["address"] instanceof Uint8Array &&
		obj["address"].length === 20 &&
		typeof obj["slot"] === "bigint"
	);
}
