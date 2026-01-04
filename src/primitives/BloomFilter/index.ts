// Import implementation functions with proper types
import { add as _add } from "./add.js";
import type { BloomFilterType } from "./BloomFilterType.js";
import { combine as _combine } from "./combine.js";
import { contains as _contains } from "./contains.js";
import { create as _create } from "./create.js";
import { density as _density } from "./density.js";
import { expectedFalsePositiveRate as _expectedFalsePositiveRate } from "./expectedFalsePositiveRate.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { hash as _hash, hashFromKeccak as _hashFromKeccak } from "./hash.js";
import { isEmpty as _isEmpty } from "./isEmpty.js";
import { merge as _merge } from "./merge.js";
import { toHex as _toHex } from "./toHex.js";

// Re-export type and errors
export type { BloomFilterType } from "./BloomFilterType.js";
export * from "./constants.js";
export * from "./errors.js";

// Export individual functions with proper types
export function add(filter: BloomFilterType, item: Uint8Array): void {
	_add(filter, item);
}

export function combine(...filters: BloomFilterType[]): BloomFilterType {
	return _combine(...filters);
}

export function contains(filter: BloomFilterType, item: Uint8Array): boolean {
	return _contains(filter, item);
}

export function create(m: number, k: number): BloomFilterType {
	return _create(m, k);
}

export function density(filter: BloomFilterType): number {
	return _density(filter);
}

export function expectedFalsePositiveRate(
	filter: BloomFilterType,
	itemCount: number,
): number {
	return _expectedFalsePositiveRate(filter, itemCount);
}

export function fromHex(hex: string, m: number, k: number): BloomFilterType {
	return _fromHex(hex, m, k);
}

export function hash(item: Uint8Array, seed: number, m: number): number {
	return _hash(item, seed, m);
}

export function hashFromKeccak(
	keccakHash: Uint8Array,
	seed: number,
	m: number,
): number {
	return _hashFromKeccak(keccakHash, seed, m);
}

export function isEmpty(filter: BloomFilterType): boolean {
	return _isEmpty(filter);
}

export function merge(
	filter1: BloomFilterType,
	filter2: BloomFilterType,
): BloomFilterType {
	return _merge(filter1, filter2);
}

export function toHex(filter: BloomFilterType): string {
	return _toHex(filter);
}

/**
 * Factory function for creating BloomFilter instances
 */
export function BloomFilter(m: number, k: number): BloomFilterType {
	const result = create(m, k);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
}

// Static constructors
BloomFilter.create = (m: number, k: number): BloomFilterType => {
	const result = create(m, k);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
};
BloomFilter.create.prototype = BloomFilter.prototype;

BloomFilter.fromHex = (
	value: string,
	m: number,
	k: number,
): BloomFilterType => {
	const result = fromHex(value, m, k);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
};
BloomFilter.fromHex.prototype = BloomFilter.prototype;

// Static utility methods (don't return BloomFilter instances)
BloomFilter.add = add;
BloomFilter.contains = contains;
BloomFilter.merge = (
	a: BloomFilterType,
	b: BloomFilterType,
): BloomFilterType => {
	const result = merge(a, b);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
};
BloomFilter.combine = (...filters: BloomFilterType[]): BloomFilterType => {
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
BloomFilter.prototype.add = function (value: Uint8Array): void {
	add(this as BloomFilterType, value);
};
BloomFilter.prototype.contains = function (value: Uint8Array): boolean {
	return contains(this as BloomFilterType, value);
};
BloomFilter.prototype.merge = function (
	other: BloomFilterType,
): BloomFilterType {
	const result = merge(this as BloomFilterType, other);
	Object.setPrototypeOf(result, BloomFilter.prototype);
	return result;
};
BloomFilter.prototype.toHex = function (): string {
	return toHex(this as BloomFilterType);
};
BloomFilter.prototype.isEmpty = function (): boolean {
	return isEmpty(this as BloomFilterType);
};
