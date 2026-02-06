/**
 * @module contains
 * @description Check if BloomFilter may contain an item (pure predicate)
 * @since 0.1.0
 */
import { BloomFilter, type BloomFilterType } from "@tevm/voltaire/BloomFilter";

/**
 * Check if a BloomFilter might contain an item
 *
 * False positives are possible, false negatives are not.
 *
 * @param filter - The bloom filter
 * @param item - Item to check
 * @returns true if item might be in filter, false if definitely not
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 *
 * if (BloomFilter.contains(filter, item)) {
 *   console.log('Item might be in filter')
 * }
 * ```
 */
export const contains = (filter: BloomFilterType, item: Uint8Array): boolean =>
	BloomFilter.contains(filter, item);
