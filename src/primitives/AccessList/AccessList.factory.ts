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

// Import types
import type { AccessListConstructor } from "./AccessListConstructor.js";

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
 * Factory function for creating AccessList instances
 */
export const AccessList = ((value) => {
	const result = fromValue(value);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result as any;
}) as AccessListConstructor;


// Initialize prototype
AccessList.prototype = {} as any;

// Attach static methods with prototype wrapping
AccessList.from = (value) => {
	const result = fromValue(value);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result as any;
};
AccessList.fromBytes = (bytes) => {
	const result = fromBytes(bytes);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result as any;
};
AccessList.is = is;
AccessList.isItem = isItem;
AccessList.create = () => {
	const result = create();
	Object.setPrototypeOf(result, AccessList.prototype);
	return result as any;
};
AccessList.merge = (...lists) => {
	const result = merge(...lists);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result as any;
};

// Static methods that operate on AccessList values
AccessList.gasCost = gasCost;
AccessList.gasSavings = gasSavings;
AccessList.hasSavings = hasSavings;
AccessList.includesAddress = includesAddress;
AccessList.includesStorageKey = includesStorageKey;
AccessList.keysFor = keysFor;
AccessList.deduplicate = (list) => {
	const result = deduplicate(list);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result as any;
};
AccessList.withAddress = (list, address) => {
	const result = withAddress(list, address);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result as any;
};
AccessList.withStorageKey = (list, address, key) => {
	const result = withStorageKey(list, address, key);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result as any;
};
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

// Bind prototype methods
AccessList.prototype.gasCost = Function.prototype.call.bind(gasCost) as any;
AccessList.prototype.gasSavings = Function.prototype.call.bind(gasSavings) as any;
AccessList.prototype.hasSavings = Function.prototype.call.bind(hasSavings) as any;
AccessList.prototype.includesAddress = Function.prototype.call.bind(
	includesAddress,
) as any;
AccessList.prototype.includesStorageKey = Function.prototype.call.bind(
	includesStorageKey,
) as any;
AccessList.prototype.keysFor = Function.prototype.call.bind(keysFor) as any;
AccessList.prototype.deduplicate = function () {
	const result = deduplicate(this);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result as any;
};
AccessList.prototype.withAddress = function (address: any) {
	const result = withAddress(this as any, address);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result as any;
};
AccessList.prototype.withStorageKey = function (address: any, key: any) {
	const result = withStorageKey(this as any, address, key);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result as any;
};
AccessList.prototype.assertValid = Function.prototype.call.bind(assertValid) as any;
AccessList.prototype.toBytes = Function.prototype.call.bind(toBytes) as any;
AccessList.prototype.addressCount = Function.prototype.call.bind(addressCount) as any;
AccessList.prototype.storageKeyCount = Function.prototype.call.bind(storageKeyCount) as any;
AccessList.prototype.isEmpty = Function.prototype.call.bind(isEmpty) as any;

