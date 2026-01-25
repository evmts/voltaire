/**
 * BlockNumber module for non-negative block numbers.
 * Provides Effect-based schemas and functions for block number handling.
 * 
 * @example
 * ```typescript
 * import * as BlockNumber from 'voltaire-effect/primitives/BlockNumber'
 * import * as Effect from 'effect/Effect'
 * 
 * const blockNum = await Effect.runPromise(BlockNumber.from(12345))
 * ```
 * 
 * @since 0.0.1
 * @module
 */

export { BlockNumberSchema, BlockNumberSchema as Schema } from './BlockNumberSchema.js'
export { from } from './from.js'
