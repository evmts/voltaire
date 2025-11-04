import { hash } from "./hash.js";

/**
 * Add an item to the bloom filter
 *
 * @param {import('./BrandedBloomFilter.js').BrandedBloomFilter} filter - Bloom filter
 * @param {Uint8Array} item - Item to add
 * @returns {void}
 *
 * @example
 * ```typescript
 * const filter = BloomFilter.create(2048, 3);
 * const item = new TextEncoder().encode("foo");
 * BloomFilter.add(filter, item);
 * ```
 */
export function add(filter, item) {
	for (let i = 0; i < filter.k; i++) {
		const h = hash(item, i, filter.m);
		const idx = Math.floor(h / 8);
		const bit = h % 8;
		filter[idx] |= 1 << bit;
	}
}
