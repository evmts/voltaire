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
	eq,
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
	const result = BrandedHardforkNamespace.fromString(value);
	Object.setPrototypeOf(result, Hardfork.prototype);
	return result;
}

// Static constructors
Hardfork.fromString = (value) => {
	const result = BrandedHardforkNamespace.fromString(value);
	Object.setPrototypeOf(result, Hardfork.prototype);
	return result;
};
Hardfork.fromString.prototype = Hardfork.prototype;

// Static utility methods
Hardfork.toString = BrandedHardforkNamespace.toString;
Hardfork.isValidName = BrandedHardforkNamespace.isValidName;
Hardfork.isAtLeast = BrandedHardforkNamespace.isAtLeast;
Hardfork.isBefore = BrandedHardforkNamespace.isBefore;
Hardfork.isAfter = BrandedHardforkNamespace.isAfter;
Hardfork.isEqual = BrandedHardforkNamespace.isEqual;
Hardfork.compare = BrandedHardforkNamespace.compare;
Hardfork.min = BrandedHardforkNamespace.min;
Hardfork.max = BrandedHardforkNamespace.max;
Hardfork.gte = BrandedHardforkNamespace.gte;
Hardfork.lt = BrandedHardforkNamespace.lt;
Hardfork.gt = BrandedHardforkNamespace.gt;
Hardfork.eq = BrandedHardforkNamespace.eq;
Hardfork.lte = BrandedHardforkNamespace.lte;
Hardfork.hasEIP1559 = BrandedHardforkNamespace.hasEIP1559;
Hardfork.supportsEIP1559 = BrandedHardforkNamespace.supportsEIP1559;
Hardfork.hasEIP3855 = BrandedHardforkNamespace.hasEIP3855;
Hardfork.supportsPUSH0 = BrandedHardforkNamespace.supportsPUSH0;
Hardfork.hasEIP4844 = BrandedHardforkNamespace.hasEIP4844;
Hardfork.supportsBlobs = BrandedHardforkNamespace.supportsBlobs;
Hardfork.hasEIP1153 = BrandedHardforkNamespace.hasEIP1153;
Hardfork.supportsTransientStorage = BrandedHardforkNamespace.supportsTransientStorage;
Hardfork.isPostMerge = BrandedHardforkNamespace.isPostMerge;
Hardfork.isPoS = BrandedHardforkNamespace.isPoS;
Hardfork.allNames = BrandedHardforkNamespace.allNames;
Hardfork.allIds = BrandedHardforkNamespace.allIds;
Hardfork.range = BrandedHardforkNamespace.range;

// Set up Hardfork.prototype to inherit from String.prototype
Object.setPrototypeOf(Hardfork.prototype, String.prototype);

// Instance methods
Hardfork.prototype.toString = function () {
	return BrandedHardforkNamespace.toString(this);
};
Hardfork.prototype.isAtLeast = function (other) {
	return BrandedHardforkNamespace.isAtLeast(this, other);
};
Hardfork.prototype.isBefore = function (other) {
	return BrandedHardforkNamespace.isBefore(this, other);
};
Hardfork.prototype.isAfter = function (other) {
	return BrandedHardforkNamespace.isAfter(this, other);
};
Hardfork.prototype.isEqual = function (other) {
	return BrandedHardforkNamespace.isEqual(this, other);
};
Hardfork.prototype.compare = function (other) {
	return BrandedHardforkNamespace.compare(this, other);
};
Hardfork.prototype.gte = function (other) {
	return BrandedHardforkNamespace.gte(this, other);
};
Hardfork.prototype.lt = function (other) {
	return BrandedHardforkNamespace.lt(this, other);
};
Hardfork.prototype.gt = function (other) {
	return BrandedHardforkNamespace.gt(this, other);
};
Hardfork.prototype.eq = function (other) {
	return BrandedHardforkNamespace.eq(this, other);
};
Hardfork.prototype.lte = function (other) {
	return BrandedHardforkNamespace.lte(this, other);
};
Hardfork.prototype.hasEIP1559 = function () {
	return BrandedHardforkNamespace.hasEIP1559(this);
};
Hardfork.prototype.supportsEIP1559 = function () {
	return BrandedHardforkNamespace.supportsEIP1559(this);
};
Hardfork.prototype.hasEIP3855 = function () {
	return BrandedHardforkNamespace.hasEIP3855(this);
};
Hardfork.prototype.supportsPUSH0 = function () {
	return BrandedHardforkNamespace.supportsPUSH0(this);
};
Hardfork.prototype.hasEIP4844 = function () {
	return BrandedHardforkNamespace.hasEIP4844(this);
};
Hardfork.prototype.supportsBlobs = function () {
	return BrandedHardforkNamespace.supportsBlobs(this);
};
Hardfork.prototype.hasEIP1153 = function () {
	return BrandedHardforkNamespace.hasEIP1153(this);
};
Hardfork.prototype.supportsTransientStorage = function () {
	return BrandedHardforkNamespace.supportsTransientStorage(this);
};
Hardfork.prototype.isPostMerge = function () {
	return BrandedHardforkNamespace.isPostMerge(this);
};
Hardfork.prototype.isPoS = function () {
	return BrandedHardforkNamespace.isPoS(this);
};
