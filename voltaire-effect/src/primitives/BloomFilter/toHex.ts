import { BrandedBloomFilter } from '@tevm/voltaire'

type BloomFilterType = BrandedBloomFilter.BloomFilterType

/**
 * Converts a bloom filter to hex string.
 * Pure function - never throws.
 * 
 * @param filter - The bloom filter to serialize
 * @returns Hex-encoded filter data
 * 
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 * 
 * const hex = BloomFilter.toHex(filter)
 * ```
 * 
 * @since 0.0.1
 */
export const toHex = (filter: BloomFilterType): string => BrandedBloomFilter.toHex(filter)
