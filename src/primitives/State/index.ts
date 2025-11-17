// @ts-nocheck
export * from "./StorageKeyType.js";
export * from "./constants.js";

import { create } from "./create.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromString } from "./fromString.js";
import { hashCode } from "./hashCode.js";
import { is } from "./is.js";
import { toString } from "./toString.js";

// Export individual functions (public API)
export { from, create, is, equals, toString, fromString, hashCode };

// Export internal functions (tree-shakeable)
export {
	from as _from,
	create as _create,
	is as _is,
	equals as _equals,
	toString as _toString,
	fromString as _fromString,
	hashCode as _hashCode,
};

// Namespace export
export const StorageKey = {
	from,
	create,
	is,
	equals,
	toString,
	fromString,
	hashCode,
};

/**
 * Factory function for creating StorageKey instances
 *
 * @param {import('./StorageKeyType.js').StorageKeyType} address - Contract address
 * @param {bigint} slot - Storage slot number
 * @returns {import('./StorageKeyType.js').StorageKeyType} A new StorageKey
 */
export function StorageKeyFactory(address, slot) {
	return create(address, slot);
}

export { StorageKeyFactory as default };
