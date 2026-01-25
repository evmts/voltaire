import { BrandedBloomFilter } from '@tevm/voltaire'

type BloomFilterType = BrandedBloomFilter.BloomFilterType

/**
 * Checks if an item might be in the bloom filter.
 * May return false positives, never false negatives.
 * Pure function - never throws.
 * 
 * @param filter - The bloom filter to check
 * @param item - The bytes to check for membership
 * @returns true if possibly in set, false if definitely not
 * 
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 * 
 * if (BloomFilter.contains(filter, topic)) {
 *   // topic might be in filter
 * }
 * ```
 * 
 * @since 0.0.1
 */
export const contains = (filter: BloomFilterType, item: Uint8Array): boolean => BrandedBloomFilter.contains(filter, item)
