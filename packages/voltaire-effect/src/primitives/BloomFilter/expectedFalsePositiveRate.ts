/**
 * @module expectedFalsePositiveRate
 * @description Calculate expected false positive rate (pure)
 * @since 0.1.0
 */
import { BloomFilter, type BloomFilterType } from "@tevm/voltaire/BloomFilter";

/**
 * Calculate the expected false positive rate for a given item count
 *
 * @param filter - The bloom filter
 * @param itemCount - Number of items in the filter
 * @returns Expected false positive rate (0 to 1)
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 *
 * const rate = BloomFilter.expectedFalsePositiveRate(filter, 100)
 * console.log(rate) // e.g. 0.001
 * ```
 */
export const expectedFalsePositiveRate = (
	filter: BloomFilterType,
	itemCount: number,
): number => BloomFilter.expectedFalsePositiveRate(filter, itemCount);
