import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { hashFromKeccak } from "./hash.js";
/**
 * Add an item to the bloom filter
 *
 * Uses Ethereum's bloom filter algorithm per Yellow Paper:
 * m(x, i) = KEC(x)[i, i + 1] mod 2048 for i in {0, 1, 2}
 *
 * @see https://voltaire.tevm.sh/primitives/bloomfilter for BloomFilter documentation
 * @since 0.0.0
 * @param {import('./BloomFilterType.js').BloomFilterType} filter - Bloom filter
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
    // Compute keccak256 once for efficiency
    const keccakHash = keccak256(item);
    for (let i = 0; i < filter.k; i++) {
        const h = hashFromKeccak(keccakHash, i, filter.m);
        const idx = Math.floor(h / 8);
        const bit = h % 8;
        const byte = filter[idx];
        if (byte !== undefined) {
            filter[idx] = byte | (1 << bit);
        }
    }
}
