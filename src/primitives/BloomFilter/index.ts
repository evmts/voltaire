// @ts-nocheck
import * as BrandedBloomFilter from "./BrandedBloomFilter/index.js";

// Re-export BrandedBloomFilter type and errors
export type { BrandedBloomFilter } from "./BrandedBloomFilter/index.js";
export * from "./BrandedBloomFilter/errors.js";
export * from "./BrandedBloomFilter/constants.js";

/**
 * Factory function for creating BloomFilter instances
 */
export function BloomFilter(m, k) {
	const result = BrandedBloomFilter.create(m, k);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
}

// Static constructors
BloomFilter.create = (m, k) => {
	const result = BrandedBloomFilter.create(m, k);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
};
BloomFilter.create.prototype = BloomFilter.prototype;

BloomFilter.fromHex = (value) => {
	const result = BrandedBloomFilter.fromHex(value);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
};
BloomFilter.fromHex.prototype = BloomFilter.prototype;

// Static utility methods (don't return BloomFilter instances)
BloomFilter.add = BrandedBloomFilter.add;
BloomFilter.contains = BrandedBloomFilter.contains;
BloomFilter.merge = (a, b) => {
	const result = BrandedBloomFilter.merge(a, b);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
};
BloomFilter.combine = (...filters) => {
	const result = BrandedBloomFilter.combine(...filters);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
};
BloomFilter.toHex = BrandedBloomFilter.toHex;
BloomFilter.isEmpty = BrandedBloomFilter.isEmpty;
BloomFilter.hash = BrandedBloomFilter.hash;
BloomFilter.density = BrandedBloomFilter.density;
BloomFilter.expectedFalsePositiveRate =
	BrandedBloomFilter.expectedFalsePositiveRate;

// Set up BloomFilter.prototype to inherit from Uint8Array.prototype
Object.setPrototypeOf(BloomFilter.prototype, Uint8Array.prototype);

// Instance methods
BloomFilter.prototype.add = function (value) {
	return BrandedBloomFilter.add(this, value);
};
BloomFilter.prototype.contains = function (value) {
	return BrandedBloomFilter.contains(this, value);
};
BloomFilter.prototype.merge = function (other) {
	const result = BrandedBloomFilter.merge(this, other);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
};
BloomFilter.prototype.toHex = function () {
	return BrandedBloomFilter.toHex(this);
};
BloomFilter.prototype.isEmpty = function () {
	return BrandedBloomFilter.isEmpty(this);
};
