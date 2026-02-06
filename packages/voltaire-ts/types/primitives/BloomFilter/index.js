// Import implementation functions with proper types
import { add as _add } from "./add.js";
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
export * from "./constants.js";
export * from "./errors.js";
// Export individual functions with proper types
export function add(filter, item) {
    _add(filter, item);
}
export function combine(...filters) {
    return _combine(...filters);
}
export function contains(filter, item) {
    return _contains(filter, item);
}
export function create(m, k) {
    return _create(m, k);
}
export function density(filter) {
    return _density(filter);
}
export function expectedFalsePositiveRate(filter, itemCount) {
    return _expectedFalsePositiveRate(filter, itemCount);
}
export function fromHex(hex, m, k) {
    return _fromHex(hex, m, k);
}
export function hash(item, seed, m) {
    return _hash(item, seed, m);
}
export function hashFromKeccak(keccakHash, seed, m) {
    return _hashFromKeccak(keccakHash, seed, m);
}
export function isEmpty(filter) {
    return _isEmpty(filter);
}
export function merge(filter1, filter2) {
    return _merge(filter1, filter2);
}
export function toHex(filter) {
    return _toHex(filter);
}
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
BloomFilter.fromHex = (value, m, k) => {
    const result = fromHex(value, m, k);
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
    add(this, value);
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
