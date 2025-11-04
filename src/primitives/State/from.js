/**
 * Convert StorageKeyLike to StorageKey
 *
 * @param {import('./BrandedStorageKey.js').StorageKeyLike} value - Value to convert
 * @returns {import('./BrandedStorageKey.js').BrandedStorageKey} StorageKey
 *
 * @example
 * ```typescript
 * const key = StorageKey.from({ address: addr, slot: 0n });
 * ```
 */
export function from(value) {
	return { address: value.address, slot: value.slot };
}
