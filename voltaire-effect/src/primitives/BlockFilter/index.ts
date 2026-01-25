/**
 * BlockFilter module for new block filters.
 * Used with eth_newBlockFilter for polling new blocks.
 * 
 * @example
 * ```typescript
 * import * as BlockFilter from 'voltaire-effect/primitives/BlockFilter'
 * import * as Effect from 'effect/Effect'
 * 
 * const filter = await Effect.runPromise(BlockFilter.from(filterId))
 * ```
 * 
 * @since 0.0.1
 * @module
 */

export { BlockFilterSchema, BlockFilterSchema as Schema } from './BlockFilterSchema.js'
export { from } from './from.js'
