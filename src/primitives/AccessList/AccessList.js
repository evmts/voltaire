/**
 * EIP-2930 Access List Types and Utilities
 *
 * Pre-declare accessed addresses and storage keys for gas optimization.
 * Factory function pattern with both static and instance methods.
 *
 * @example
 * ```typescript
 * import { AccessList } from './AccessList.js';
 *
 * // Factory function
 * const list = AccessList([{ address, storageKeys: [] }]);
 *
 * // Static methods
 * const cost = AccessList.gasCost(list);
 * const savings = AccessList.gasSavings(list);
 *
 * // Instance methods
 * const cost2 = list.gasCost();
 * const savings2 = list.gasSavings();
 * ```
 */

// Import all method functions
import { addressCount } from "./addressCount.js";
import { assertValid } from "./assertValid.js";
import { create } from "./create.js";
import { deduplicate } from "./deduplicate.js";
import { from as fromValue } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import {
	ADDRESS_COST,
	gasCost,
	STORAGE_KEY_COST,
} from "./gasCost.js";
import {
	COLD_ACCOUNT_ACCESS_COST,
	COLD_STORAGE_ACCESS_COST,
	gasSavings,
	WARM_STORAGE_ACCESS_COST,
} from "./gasSavings.js";
import { hasSavings } from "./hasSavings.js";
import { includesAddress } from "./includesAddress.js";
import { includesStorageKey } from "./includesStorageKey.js";
import { is } from "./is.js";
import { isEmpty } from "./isEmpty.js";
import { isItem } from "./isItem.js";
import { keysFor } from "./keysFor.js";
import { merge } from "./merge.js";
import { storageKeyCount } from "./storageKeyCount.js";
import { toBytes } from "./toBytes.js";
import { withAddress } from "./withAddress.js";
import { withStorageKey } from "./withStorageKey.js";

// Re-export types
export * from "./BrandedAccessList.js";

// Re-export method functions for tree-shaking
export {
	addressCount,
	assertValid,
	create,
	deduplicate,
	fromBytes,
	fromValue as from,
	gasCost,
	gasSavings,
	hasSavings,
	includesAddress,
	includesStorageKey,
	is,
	isEmpty,
	isItem,
	keysFor,
	merge,
	storageKeyCount,
	toBytes,
	withAddress,
	withStorageKey,
	ADDRESS_COST,
	STORAGE_KEY_COST,
	COLD_ACCOUNT_ACCESS_COST,
	COLD_STORAGE_ACCESS_COST,
	WARM_STORAGE_ACCESS_COST,
};

/**
 * @typedef {import('./BrandedAccessList.js').BrandedAccessList} BrandedAccessList
 * @typedef {import('./AccessListConstructor.js').AccessListConstructor} AccessListConstructor
 */

/**
 * Factory function for creating AccessList instances
 *
 * @type {AccessListConstructor}
 */
export function AccessList(value) {
	return fromValue(value);
}

// Attach static methods - wrapped to set prototype without mutating originals
AccessList.from = function (value) {
	return fromValue(value);
};
AccessList.from.prototype = AccessList.prototype;

AccessList.fromBytes = function (value) {
	return fromBytes(value);
};
AccessList.fromBytes.prototype = AccessList.prototype;
AccessList.is = is;
AccessList.isItem = isItem;
AccessList.create = create;
AccessList.merge = merge;

// Static methods that operate on AccessList values
AccessList.gasCost = gasCost;
AccessList.gasSavings = gasSavings;
AccessList.hasSavings = hasSavings;
AccessList.includesAddress = includesAddress;
AccessList.includesStorageKey = includesStorageKey;
AccessList.keysFor = keysFor;
AccessList.deduplicate = deduplicate;
AccessList.withAddress = withAddress;
AccessList.withStorageKey = withStorageKey;
AccessList.assertValid = assertValid;
AccessList.toBytes = toBytes;
AccessList.addressCount = addressCount;
AccessList.storageKeyCount = storageKeyCount;
AccessList.isEmpty = isEmpty;

// Gas cost constants
AccessList.ADDRESS_COST = ADDRESS_COST;
AccessList.STORAGE_KEY_COST = STORAGE_KEY_COST;
AccessList.COLD_ACCOUNT_ACCESS_COST = COLD_ACCOUNT_ACCESS_COST;
AccessList.COLD_STORAGE_ACCESS_COST = COLD_STORAGE_ACCESS_COST;
AccessList.WARM_STORAGE_ACCESS_COST = WARM_STORAGE_ACCESS_COST;

// Bind prototype methods using Function.prototype.call.bind
AccessList.prototype.gasCost = Function.prototype.call.bind(gasCost);
AccessList.prototype.gasSavings = Function.prototype.call.bind(gasSavings);
AccessList.prototype.hasSavings = Function.prototype.call.bind(hasSavings);
AccessList.prototype.includesAddress =
	Function.prototype.call.bind(includesAddress);
AccessList.prototype.includesStorageKey = Function.prototype.call.bind(
	includesStorageKey,
);
AccessList.prototype.keysFor = Function.prototype.call.bind(keysFor);
AccessList.prototype.deduplicate = Function.prototype.call.bind(deduplicate);
AccessList.prototype.withAddress = Function.prototype.call.bind(withAddress);
AccessList.prototype.withStorageKey =
	Function.prototype.call.bind(withStorageKey);
AccessList.prototype.assertValid = Function.prototype.call.bind(assertValid);
AccessList.prototype.toBytes = Function.prototype.call.bind(toBytes);
AccessList.prototype.addressCount = Function.prototype.call.bind(addressCount);
AccessList.prototype.storageKeyCount =
	Function.prototype.call.bind(storageKeyCount);
AccessList.prototype.isEmpty = Function.prototype.call.bind(isEmpty);
