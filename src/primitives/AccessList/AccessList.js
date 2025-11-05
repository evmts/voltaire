import {
	ADDRESS_COST,
	COLD_ACCOUNT_ACCESS_COST,
	COLD_STORAGE_ACCESS_COST,
	STORAGE_KEY_COST,
	WARM_STORAGE_ACCESS_COST,
} from "./constants.js";

import { addressCount } from "./addressCount.js";
import { assertValid } from "./assertValid.js";
import { create } from "./create.js";
import { deduplicate } from "./deduplicate.js";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { gasCost } from "./gasCost.js";
import { gasSavings } from "./gasSavings.js";
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

// Export individual functions
export {
	from,
	fromBytes,
	is,
	isItem,
	create,
	merge,
	gasCost,
	gasSavings,
	hasSavings,
	includesAddress,
	includesStorageKey,
	keysFor,
	deduplicate,
	withAddress,
	withStorageKey,
	assertValid,
	toBytes,
	addressCount,
	storageKeyCount,
	isEmpty,
};

/**
 * @typedef {import('./BrandedAccessList.js').BrandedAccessList} BrandedAccessList
 * @typedef {import('./BrandedAccessList.js').Item} Item
 */

/**
 * Factory function for creating AccessList instances (EIP-2930)
 *
 * @param {readonly Item[] | Uint8Array} value
 * @returns {BrandedAccessList}
 */
export function AccessList(value) {
	return from(value);
}

AccessList.from = (value) => from(value);
AccessList.from.prototype = AccessList.prototype;
AccessList.fromBytes = (value) => fromBytes(value);
AccessList.fromBytes.prototype = AccessList.prototype;

AccessList.is = is;
AccessList.isItem = isItem;
AccessList.create = create;
AccessList.merge = merge;
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
AccessList.ADDRESS_COST = ADDRESS_COST;
AccessList.STORAGE_KEY_COST = STORAGE_KEY_COST;
AccessList.COLD_ACCOUNT_ACCESS_COST = COLD_ACCOUNT_ACCESS_COST;
AccessList.COLD_STORAGE_ACCESS_COST = COLD_STORAGE_ACCESS_COST;
AccessList.WARM_STORAGE_ACCESS_COST = WARM_STORAGE_ACCESS_COST;

AccessList.prototype.gasCost = Function.prototype.call.bind(gasCost);
AccessList.prototype.gasSavings = Function.prototype.call.bind(gasSavings);
AccessList.prototype.hasSavings = Function.prototype.call.bind(hasSavings);
AccessList.prototype.includesAddress =
	Function.prototype.call.bind(includesAddress);
AccessList.prototype.includesStorageKey =
	Function.prototype.call.bind(includesStorageKey);
AccessList.prototype.keysFor = Function.prototype.call.bind(keysFor);
AccessList.prototype.deduplicate = function () {
	const result = deduplicate(this);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result;
};
AccessList.prototype.withAddress = function (address) {
	const result = withAddress(this, address);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result;
};
AccessList.prototype.withStorageKey = function (address, key) {
	const result = withStorageKey(this, address, key);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result;
};
AccessList.prototype.assertValid = Function.prototype.call.bind(assertValid);
AccessList.prototype.toBytes = Function.prototype.call.bind(toBytes);
AccessList.prototype.addressCount = Function.prototype.call.bind(addressCount);
AccessList.prototype.storageKeyCount =
	Function.prototype.call.bind(storageKeyCount);
AccessList.prototype.isEmpty = Function.prototype.call.bind(isEmpty);
