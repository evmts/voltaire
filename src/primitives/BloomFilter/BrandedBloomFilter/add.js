import { hash } from "./hash.js";

/**
 * Add an item to the bloom filter
 *
 * @see https://voltaire.tevm.sh/primitives/bloomfilter for BloomFilter documentation
 * @since 0.0.0
 * @param {import('./BrandedBloomFilter.js').BrandedBloomFilter} filter - Bloom filter
 * @param {Uint8Array} item - Item to add
 * @returns {void}
 * @throws {never}
 * @example
 * ```javascript
 * import * as BloomFilter from './primitives/BloomFilter/index.js';
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
		const byte = filter[idx];
		if (byte !== undefined) {
			filter[idx] = byte | (1 << bit);
		}
	}
}
