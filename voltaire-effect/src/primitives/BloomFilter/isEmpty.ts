import { BrandedBloomFilter } from '@tevm/voltaire'

type BloomFilterType = BrandedBloomFilter.BloomFilterType

/**
 * Checks if the bloom filter is empty.
 * Pure function - never throws.
 * 
 * @param filter - The bloom filter to check
 * @returns true if no items have been added, false otherwise
 * 
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 * 
 * if (BloomFilter.isEmpty(filter)) {
 *   console.log('No items in filter')
 * }
 * ```
 * 
 * @since 0.0.1
 */
export const isEmpty = (filter: BloomFilterType): boolean => BrandedBloomFilter.isEmpty(filter)
