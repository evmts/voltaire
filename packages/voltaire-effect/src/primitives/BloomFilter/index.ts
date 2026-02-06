/**
 * @module BloomFilter
 * @description Effect Schemas and functions for Ethereum bloom filters.
 *
 * Bloom filters are probabilistic data structures used in Ethereum for efficient
 * log searching. Each block contains a logs bloom filter (2048 bits, 3 hash functions)
 * that allows quick checking of whether a block might contain relevant logs.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 *
 * function checkLogs(filter: BloomFilter.BloomFilterType) {
 *   // ...
 * }
 * ```
 *
 * ## Constructors (Effect-wrapped)
 *
 * ```typescript
 * BloomFilter.create(m, k)           // Effect<BloomFilterType, InvalidBloomFilterParameterError>
 * BloomFilter.fromHex(hex, m, k)     // Effect<BloomFilterType, InvalidBloomFilterLengthError>
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * BloomFilter.add(filter, item)      // void (mutates in place)
 * BloomFilter.contains(filter, item) // boolean
 * BloomFilter.combine(...filters)    // BloomFilterType
 * BloomFilter.merge(f1, f2)          // BloomFilterType
 * BloomFilter.toHex(filter)          // string
 * BloomFilter.isEmpty(filter)        // boolean
 * BloomFilter.density(filter)        // number
 * BloomFilter.expectedFalsePositiveRate(filter, n) // number
 * BloomFilter.hash(item, seed, m)    // number
 * BloomFilter.hashFromKeccak(hash, seed, m) // number
 * ```
 *
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const filter = yield* BloomFilter.create(2048, 3)
 *   BloomFilter.add(filter, transferEventTopic)
 *
 *   if (BloomFilter.contains(filter, searchTopic)) {
 *     console.log('Topic might be in filter')
 *   }
 *
 *   return BloomFilter.toHex(filter)
 * })
 * ```
 *
 * @since 0.1.0
 */

// Re-export type
export type { BloomFilterType } from "@tevm/voltaire/BloomFilter";

// Re-export errors
export {
	InvalidBloomFilterLengthError,
	InvalidBloomFilterParameterError,
} from "@tevm/voltaire/BloomFilter";

// Schema
export { BloomFilterSchema, BloomFilterSchema as Schema } from "./BloomFilterSchema.js";

// Constructors (Effect-wrapped)
export { create } from "./create.js";
export { fromHex } from "./fromHex.js";

// Pure functions
export { add } from "./add.js";
export { combine } from "./combine.js";
export { contains } from "./contains.js";
export { density } from "./density.js";
export { expectedFalsePositiveRate } from "./expectedFalsePositiveRate.js";
export { hash, hashFromKeccak } from "./hash.js";
export { isEmpty } from "./isEmpty.js";
export { merge } from "./merge.js";
export { toHex } from "./toHex.js";
