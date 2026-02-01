/**
 * @module merge
 * @description Merge two BloomFilters into one (pure)
 * @since 0.1.0
 */
import { BloomFilter, type BloomFilterType } from "@tevm/voltaire/BloomFilter";

/**
 * Merge two BloomFilters into a single filter
 *
 * @param filter1 - First filter
 * @param filter2 - Second filter
 * @returns Merged bloom filter
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 *
 * const merged = BloomFilter.merge(filter1, filter2)
 * ```
 */
export const merge = (
	filter1: BloomFilterType,
	filter2: BloomFilterType,
): BloomFilterType => BloomFilter.merge(filter1, filter2);
