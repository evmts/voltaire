/**
 * BloomFilter module for Ethereum log bloom filters.
 * Provides probabilistic set membership testing for logs.
 * 
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 * import * as Effect from 'effect/Effect'
 * 
 * const program = Effect.gen(function* () {
 *   const filter = yield* BloomFilter.create(2048, 3)
 *   yield* BloomFilter.add(filter, topic)
 *   return BloomFilter.contains(filter, topic)
 * })
 * ```
 * 
 * @since 0.0.1
 * @module
 */

export { BloomFilterSchema, BloomFilterSchema as Schema } from './BloomFilterSchema.js'
export { create } from './create.js'
export { fromHex } from './fromHex.js'
export { add } from './add.js'
export { contains } from './contains.js'
export { toHex } from './toHex.js'
export { isEmpty } from './isEmpty.js'
