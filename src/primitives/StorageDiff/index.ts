export type {
	StorageChange,
	StorageDiffType,
} from "./StorageDiffType.js";

import { from as _from } from "./from.js";
import { getChange as _getChange } from "./getChange.js";
import { getKeys as _getKeys } from "./getKeys.js";
import { size as _size } from "./size.js";

// Export constructors
export { from } from "./from.js";

// Export public wrapper functions
export function getChange(
	diff:
		| import("./StorageDiffType.js").StorageDiffType
		| [
				import("../Address/AddressType.js").AddressType,
				Map<
					import("../State/StorageKeyType.js").StorageKeyType,
					import("./StorageDiffType.js").StorageChange
				>,
		  ],
	key: import("../State/StorageKeyType.js").StorageKeyType,
): import("./StorageDiffType.js").StorageChange | undefined {
	const d = Array.isArray(diff) ? _from(diff[0], diff[1]) : diff;
	return _getChange(d, key);
}

export function getKeys(
	diff:
		| import("./StorageDiffType.js").StorageDiffType
		| [
				import("../Address/AddressType.js").AddressType,
				Map<
					import("../State/StorageKeyType.js").StorageKeyType,
					import("./StorageDiffType.js").StorageChange
				>,
		  ],
): Array<import("../State/StorageKeyType.js").StorageKeyType> {
	const d = Array.isArray(diff) ? _from(diff[0], diff[1]) : diff;
	return _getKeys(d);
}

export function size(
	diff:
		| import("./StorageDiffType.js").StorageDiffType
		| [
				import("../Address/AddressType.js").AddressType,
				Map<
					import("../State/StorageKeyType.js").StorageKeyType,
					import("./StorageDiffType.js").StorageChange
				>,
		  ],
): number {
	const d = Array.isArray(diff) ? _from(diff[0], diff[1]) : diff;
	return _size(d);
}

// Export internal functions (tree-shakeable)
export { _getChange, _getKeys, _size };

// Namespace export
export const StorageDiff = {
	from: _from,
	getChange,
	getKeys,
	size,
};
