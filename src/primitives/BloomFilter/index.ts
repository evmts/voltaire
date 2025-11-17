// @ts-nocheck
import { add } from "./add.js";
import { combine } from "./combine.js";
import { contains } from "./contains.js";
import { create } from "./create.js";
import { density } from "./density.js";
import { expectedFalsePositiveRate } from "./expectedFalsePositiveRate.js";
import { fromHex } from "./fromHex.js";
import { hash } from "./hash.js";
import { isEmpty } from "./isEmpty.js";
import { merge } from "./merge.js";
import { toHex } from "./toHex.js";

// Re-export type and errors
export type { BloomFilterType } from "./BloomFilterType.js";
export * from "./errors.js";
export * from "./constants.js";

// Export individual functions
export {
	add,
	combine,
	contains,
	create,
	density,
	expectedFalsePositiveRate,
	fromHex,
	hash,
	isEmpty,
	merge,
	toHex,
};

/**
 * Factory function for creating BloomFilter instances
 */
export function BloomFilter(m, k) {
	const result = create(m, k);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
}

// Static constructors
BloomFilter.create = (m, k) => {
	const result = create(m, k);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
};
BloomFilter.create.prototype = BloomFilter.prototype;

BloomFilter.fromHex = (value) => {
	const result = fromHex(value);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
};
BloomFilter.fromHex.prototype = BloomFilter.prototype;

// Static utility methods (don't return BloomFilter instances)
BloomFilter.add = add;
BloomFilter.contains = contains;
BloomFilter.merge = (a, b) => {
	const result = merge(a, b);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
};
BloomFilter.combine = (...filters) => {
	const result = combine(...filters);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
};
BloomFilter.toHex = toHex;
BloomFilter.isEmpty = isEmpty;
BloomFilter.hash = hash;
BloomFilter.density = density;
BloomFilter.expectedFalsePositiveRate = expectedFalsePositiveRate;

// Set up BloomFilter.prototype to inherit from Uint8Array.prototype
Object.setPrototypeOf(BloomFilter.prototype, Uint8Array.prototype);

// Instance methods
BloomFilter.prototype.add = function (value) {
	return add(this, value);
};
BloomFilter.prototype.contains = function (value) {
	return contains(this, value);
};
BloomFilter.prototype.merge = function (other) {
	const result = merge(this, other);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
};
BloomFilter.prototype.toHex = function () {
	return toHex(this);
};
BloomFilter.prototype.isEmpty = function () {
	return isEmpty(this);
};
