// @ts-nocheck
import * as BrandedHardfork from "./BrandedHardfork/index.js";

// Re-export BrandedHardfork type and constants
export type { BrandedHardfork } from "./BrandedHardfork/index.js";
export * from "./BrandedHardfork/constants.js";

// Re-export individual functions for direct import
export {
	fromString,
	toString,
	isValidName,
	isAtLeast,
	isBefore,
	isAfter,
	isEqual,
	compare,
	min,
	max,
	gte,
	lt,
	gt,
	equals,
	lte,
	hasEIP1559,
	supportsEIP1559,
	hasEIP3855,
	supportsPUSH0,
	hasEIP4844,
	supportsBlobs,
	hasEIP1153,
	supportsTransientStorage,
	isPostMerge,
	isPoS,
	allNames,
	allIds,
	range,
} from "./BrandedHardfork/index.js";

/**
 * Factory function for creating Hardfork instances
 */
export function Hardfork(value) {
	const result = BrandedHardfork.fromString(value);
	Object.setPrototypeOf(result, Hardfork.prototype);
	return result;
}

// Static constructors
Hardfork.fromString = (value) => {
	const result = BrandedHardfork.fromString(value);
	Object.setPrototypeOf(result, Hardfork.prototype);
	return result;
};
Hardfork.fromString.prototype = Hardfork.prototype;

// Static utility methods
Hardfork.toString = BrandedHardfork.toString;
Hardfork.isValidName = BrandedHardfork.isValidName;
Hardfork.isAtLeast = BrandedHardfork.isAtLeast;
Hardfork.isBefore = BrandedHardfork.isBefore;
Hardfork.isAfter = BrandedHardfork.isAfter;
Hardfork.isEqual = BrandedHardfork.isEqual;
Hardfork.compare = BrandedHardfork.compare;
Hardfork.min = BrandedHardfork.min;
Hardfork.max = BrandedHardfork.max;
Hardfork.gte = BrandedHardfork.gte;
Hardfork.lt = BrandedHardfork.lt;
Hardfork.gt = BrandedHardfork.gt;
Hardfork.equals = BrandedHardfork.equals;
Hardfork.lte = BrandedHardfork.lte;
Hardfork.hasEIP1559 = BrandedHardfork.hasEIP1559;
Hardfork.supportsEIP1559 = BrandedHardfork.supportsEIP1559;
Hardfork.hasEIP3855 = BrandedHardfork.hasEIP3855;
Hardfork.supportsPUSH0 = BrandedHardfork.supportsPUSH0;
Hardfork.hasEIP4844 = BrandedHardfork.hasEIP4844;
Hardfork.supportsBlobs = BrandedHardfork.supportsBlobs;
Hardfork.hasEIP1153 = BrandedHardfork.hasEIP1153;
Hardfork.supportsTransientStorage = BrandedHardfork.supportsTransientStorage;
Hardfork.isPostMerge = BrandedHardfork.isPostMerge;
Hardfork.isPoS = BrandedHardfork.isPoS;
Hardfork.allNames = BrandedHardfork.allNames;
Hardfork.allIds = BrandedHardfork.allIds;
Hardfork.range = BrandedHardfork.range;

// Set up Hardfork.prototype to inherit from String.prototype
Object.setPrototypeOf(Hardfork.prototype, String.prototype);

// Instance methods
Hardfork.prototype.toString = function () {
	return BrandedHardfork.toString(this);
};
Hardfork.prototype.isAtLeast = function (other) {
	return BrandedHardfork.isAtLeast(this, other);
};
Hardfork.prototype.isBefore = function (other) {
	return BrandedHardfork.isBefore(this, other);
};
Hardfork.prototype.isAfter = function (other) {
	return BrandedHardfork.isAfter(this, other);
};
Hardfork.prototype.isEqual = function (other) {
	return BrandedHardfork.isEqual(this, other);
};
Hardfork.prototype.compare = function (other) {
	return BrandedHardfork.compare(this, other);
};
Hardfork.prototype.gte = function (other) {
	return BrandedHardfork.gte(this, other);
};
Hardfork.prototype.lt = function (other) {
	return BrandedHardfork.lt(this, other);
};
Hardfork.prototype.gt = function (other) {
	return BrandedHardfork.gt(this, other);
};
Hardfork.prototype.equals = function (other) {
	return BrandedHardfork.equals(this, other);
};
Hardfork.prototype.lte = function (other) {
	return BrandedHardfork.lte(this, other);
};
Hardfork.prototype.hasEIP1559 = function () {
	return BrandedHardfork.hasEIP1559(this);
};
Hardfork.prototype.supportsEIP1559 = function () {
	return BrandedHardfork.supportsEIP1559(this);
};
Hardfork.prototype.hasEIP3855 = function () {
	return BrandedHardfork.hasEIP3855(this);
};
Hardfork.prototype.supportsPUSH0 = function () {
	return BrandedHardfork.supportsPUSH0(this);
};
Hardfork.prototype.hasEIP4844 = function () {
	return BrandedHardfork.hasEIP4844(this);
};
Hardfork.prototype.supportsBlobs = function () {
	return BrandedHardfork.supportsBlobs(this);
};
Hardfork.prototype.hasEIP1153 = function () {
	return BrandedHardfork.hasEIP1153(this);
};
Hardfork.prototype.supportsTransientStorage = function () {
	return BrandedHardfork.supportsTransientStorage(this);
};
Hardfork.prototype.isPostMerge = function () {
	return BrandedHardfork.isPostMerge(this);
};
Hardfork.prototype.isPoS = function () {
	return BrandedHardfork.isPoS(this);
};
