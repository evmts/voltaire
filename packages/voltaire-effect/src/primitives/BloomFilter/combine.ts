/**
 * @module combine
 * @description Combine multiple BloomFilters into one (pure)
 * @since 0.1.0
 */
import { BloomFilter, type BloomFilterType } from "@tevm/voltaire/BloomFilter";

/**
 * Combine multiple BloomFilters into a single filter
 *
 * @param filters - Filters to combine
 * @returns Combined bloom filter
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 *
 * const combined = BloomFilter.combine(filter1, filter2, filter3)
 * ```
 */
export const combine = (...filters: BloomFilterType[]): BloomFilterType =>
	BloomFilter.combine(...filters);
