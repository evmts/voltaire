// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";
export * from "./BrandedBloomFilter.js";

import { add } from "./add.js";
import { contains } from "./contains.js";
import { create } from "./create.js";
import { fromHex } from "./fromHex.js";
import { isEmpty } from "./isEmpty.js";
import { merge } from "./merge.js";
import { toHex } from "./toHex.js";

// Export individual functions
export { create, add, contains, merge, toHex, fromHex, isEmpty };

/**
 * @typedef {import('./BrandedBloomFilter.js').BrandedBloomFilter} BrandedBloomFilter
 */

/**
 * Factory function for creating BloomFilter instances
 *
 * @param {number} m - Number of bits
 * @param {number} k - Number of hash functions
 * @returns {BrandedBloomFilter} BloomFilter
 */
export function BloomFilter(m, k) {
	return create(m, k);
}

BloomFilter.create = create;
BloomFilter.add = add;
BloomFilter.contains = contains;
BloomFilter.merge = merge;
BloomFilter.toHex = toHex;
BloomFilter.fromHex = fromHex;
BloomFilter.isEmpty = isEmpty;

BloomFilter.prototype = Uint8Array.prototype;
BloomFilter.prototype.toHex = Function.prototype.call.bind(toHex);
