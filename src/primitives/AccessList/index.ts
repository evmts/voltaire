// @ts-nocheck
import * as BrandedAccessList from "./BrandedAccessList/index.js";

// Re-export BrandedAccessList types and constants
export type { BrandedAccessList, Item } from "./BrandedAccessList.ts";
export * from "./BrandedAccessList/constants.js";

/**
 * Factory function for creating AccessList instances
 */
export function AccessList(value) {
	const result = BrandedAccessList.from(value);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result;
}

// Static constructors
AccessList.from = (value) => {
	const result = BrandedAccessList.from(value);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result;
};
AccessList.from.prototype = AccessList.prototype;

AccessList.fromBytes = (value) => {
	const result = BrandedAccessList.fromBytes(value);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result;
};
AccessList.fromBytes.prototype = AccessList.prototype;

// Static utility methods (don't return AccessList instances)
AccessList.is = BrandedAccessList.is;
AccessList.isItem = BrandedAccessList.isItem;
AccessList.create = BrandedAccessList.create;
AccessList.merge = BrandedAccessList.merge;
AccessList.gasCost = BrandedAccessList.gasCost;
AccessList.gasSavings = BrandedAccessList.gasSavings;
AccessList.hasSavings = BrandedAccessList.hasSavings;
AccessList.includesAddress = BrandedAccessList.includesAddress;
AccessList.includesStorageKey = BrandedAccessList.includesStorageKey;
AccessList.keysFor = BrandedAccessList.keysFor;
AccessList.assertValid = BrandedAccessList.assertValid;
AccessList.toBytes = BrandedAccessList.toBytes;
AccessList.addressCount = BrandedAccessList.addressCount;
AccessList.storageKeyCount = BrandedAccessList.storageKeyCount;
AccessList.isEmpty = BrandedAccessList.isEmpty;

AccessList.deduplicate = (accessList) => {
	const result = BrandedAccessList.deduplicate(accessList);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result;
};

AccessList.withAddress = (accessList, address) => {
	const result = BrandedAccessList.withAddress(accessList, address);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result;
};

AccessList.withStorageKey = (accessList, address, key) => {
	const result = BrandedAccessList.withStorageKey(accessList, address, key);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result;
};

AccessList.ADDRESS_COST = BrandedAccessList.ADDRESS_COST;
AccessList.STORAGE_KEY_COST = BrandedAccessList.STORAGE_KEY_COST;
AccessList.COLD_ACCOUNT_ACCESS_COST =
	BrandedAccessList.COLD_ACCOUNT_ACCESS_COST;
AccessList.COLD_STORAGE_ACCESS_COST =
	BrandedAccessList.COLD_STORAGE_ACCESS_COST;
AccessList.WARM_STORAGE_ACCESS_COST =
	BrandedAccessList.WARM_STORAGE_ACCESS_COST;

// Set up AccessList.prototype to inherit from Array.prototype
Object.setPrototypeOf(AccessList.prototype, Array.prototype);

// Instance methods
AccessList.prototype.gasCost = function () {
	return BrandedAccessList.gasCost(this);
};
AccessList.prototype.gasSavings = function () {
	return BrandedAccessList.gasSavings(this);
};
AccessList.prototype.hasSavings = function () {
	return BrandedAccessList.hasSavings(this);
};
AccessList.prototype.includesAddress = function (address) {
	return BrandedAccessList.includesAddress(this, address);
};
AccessList.prototype.includesStorageKey = function (address, key) {
	return BrandedAccessList.includesStorageKey(this, address, key);
};
AccessList.prototype.keysFor = function (address) {
	return BrandedAccessList.keysFor(this, address);
};
AccessList.prototype.deduplicate = function () {
	const result = BrandedAccessList.deduplicate(this);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result;
};
AccessList.prototype.withAddress = function (address) {
	const result = BrandedAccessList.withAddress(this, address);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result;
};
AccessList.prototype.withStorageKey = function (address, key) {
	const result = BrandedAccessList.withStorageKey(this, address, key);
	Object.setPrototypeOf(result, AccessList.prototype);
	return result;
};
AccessList.prototype.assertValid = function () {
	return BrandedAccessList.assertValid(this);
};
AccessList.prototype.toBytes = function () {
	return BrandedAccessList.toBytes(this);
};
AccessList.prototype.addressCount = function () {
	return BrandedAccessList.addressCount(this);
};
AccessList.prototype.storageKeyCount = function () {
	return BrandedAccessList.storageKeyCount(this);
};
AccessList.prototype.isEmpty = function () {
	return BrandedAccessList.isEmpty(this);
};
