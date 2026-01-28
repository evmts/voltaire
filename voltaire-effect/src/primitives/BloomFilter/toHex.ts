/**
 * @module toHex
 * @description Convert BloomFilter to hex string (pure)
 * @since 0.1.0
 */
import { BloomFilter, type BloomFilterType } from "@tevm/voltaire/BloomFilter";

/**
 * Convert BloomFilter to hex string
 *
 * @param filter - The bloom filter
 * @returns Hex string representation
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 *
 * const hex = BloomFilter.toHex(filter)
 * console.log(hex) // '0x00...'
 * ```
 */
export const toHex = (filter: BloomFilterType): string =>
	BloomFilter.toHex(filter);
