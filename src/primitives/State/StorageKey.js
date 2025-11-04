// @ts-nocheck
export * from "./constants.js";
export * from "./BrandedStorageKey.js";

import { create } from "./create.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromString } from "./fromString.js";
import { hashCode } from "./hashCode.js";
import { is } from "./is.js";
import { toString } from "./toString.js";

// Export individual functions
export { from, create, is, equals, toString, fromString, hashCode };

/**
 * @typedef {import('./BrandedStorageKey.js').BrandedStorageKey} BrandedStorageKey
 * @typedef {import('./BrandedStorageKey.js').StorageKeyLike} StorageKeyLike
 */

/**
 * Factory function for creating StorageKey instances
 *
 * @param {import('../Address/index.js').BrandedAddress} address - Contract address
 * @param {bigint} slot - Storage slot number
 * @returns {BrandedStorageKey} A new StorageKey
 */
export function StorageKey(address, slot) {
	return create(address, slot);
}

StorageKey.from = from;
StorageKey.create = create;
StorageKey.is = is;
StorageKey.equals = equals;
StorageKey.toString = toString;
StorageKey.fromString = fromString;
StorageKey.hashCode = hashCode;
