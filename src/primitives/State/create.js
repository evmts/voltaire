/**
 * Create a new StorageKey
 *
 * @param {import('../Address/index.js').BrandedAddress} address - Contract address
 * @param {bigint} slot - Storage slot number
 * @returns {import('./BrandedStorageKey.js').BrandedStorageKey} A new StorageKey
 *
 * @example
 * ```typescript
 * const key = StorageKey.create(contractAddr, 0n);
 * ```
 */
export function create(address, slot) {
	return { address, slot };
}
