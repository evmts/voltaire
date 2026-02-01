import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { hashFromKeccak } from "./hash.js";
/**
 * Check if an item might be in the bloom filter
 * Returns false if definitely not present, true if possibly present
 *
 * Uses Ethereum's bloom filter algorithm per Yellow Paper:
 * m(x, i) = KEC(x)[i, i + 1] mod 2048 for i in {0, 1, 2}
 *
 * @param {import('./BloomFilterType.js').BloomFilterType} filter - Bloom filter
 * @param {Uint8Array} item - Item to check
 * @returns {boolean} True if item might be present, false if definitely not
 *
 * @example
 * ```typescript
 * const filter = BloomFilter.create(2048, 3);
 * const item = new TextEncoder().encode("foo");
 * BloomFilter.add(filter, item);
 * console.log(BloomFilter.contains(filter, item)); // true
 * ```
 */
export function contains(filter, item) {
    // Compute keccak256 once for efficiency
    const keccakHash = keccak256(item);
    for (let i = 0; i < filter.k; i++) {
        const h = hashFromKeccak(keccakHash, i, filter.m);
        const idx = Math.floor(h / 8);
        const bit = h % 8;
        const byte = filter[idx];
        if (byte === undefined || (byte & (1 << bit)) === 0) {
            return false;
        }
    }
    return true;
}
