// @ts-nocheck
import * as BrandedStorageKey from "./BrandedState/index.js";

// Re-export types and constants
export type { BrandedStorageKey } from "./BrandedState/index.js";
export * from "./BrandedState/constants.js";

/**
 * Factory function for creating StorageKey instances
 *
 * @param {import('./BrandedState/BrandedStorageKey.js').BrandedAddress} address - Contract address
 * @param {bigint} slot - Storage slot number
 * @returns {import('./BrandedState/BrandedStorageKey.js').BrandedStorageKey} A new StorageKey
 */
export function StorageKey(address, slot) {
	return BrandedStorageKey.create(address, slot);
}

// Static methods
StorageKey.from = BrandedStorageKey.from;
StorageKey.create = BrandedStorageKey.create;
StorageKey.is = BrandedStorageKey.is;
StorageKey.equals = BrandedStorageKey.equals;
StorageKey.toString = BrandedStorageKey.toString;
StorageKey.fromString = BrandedStorageKey.fromString;
StorageKey.hashCode = BrandedStorageKey.hashCode;

export { StorageKey as default };
