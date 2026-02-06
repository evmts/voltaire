/**
 * @module hash
 * @description BloomFilter hash functions (pure)
 * @since 0.1.0
 */
import * as BloomFilterModule from "@tevm/voltaire/BloomFilter";

/**
 * Hash an item for BloomFilter insertion/lookup
 *
 * @param item - Item to hash
 * @param seed - Hash function seed
 * @param m - Filter size in bits
 * @returns Hash value (bit position)
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 *
 * const pos = BloomFilter.hash(item, 0, 2048)
 * ```
 */
export const hash = (item: Uint8Array, seed: number, m: number): number =>
	BloomFilterModule.hash(item, seed, m);

/**
 * Hash from pre-computed keccak hash
 *
 * @param keccakHash - Pre-computed keccak hash
 * @param seed - Hash function seed
 * @param m - Filter size in bits
 * @returns Hash value (bit position)
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 *
 * const pos = BloomFilter.hashFromKeccak(keccakResult, 0, 2048)
 * ```
 */
export const hashFromKeccak = (
	keccakHash: Uint8Array,
	seed: number,
	m: number,
): number => BloomFilterModule.hashFromKeccak(keccakHash, seed, m);
