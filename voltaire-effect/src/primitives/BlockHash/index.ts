/**
 * BlockHash module for 32-byte block hashes.
 * Provides Effect-based schemas and functions for block hash handling.
 * 
 * @example
 * ```typescript
 * import * as BlockHash from 'voltaire-effect/primitives/BlockHash'
 * import * as Effect from 'effect/Effect'
 * 
 * const hash = await Effect.runPromise(BlockHash.from('0x...'))
 * ```
 * 
 * @since 0.0.1
 * @module
 */

export { BlockHashSchema, BlockHashSchema as Schema } from './BlockHashSchema.js'
export { from } from './from.js'
export { toHex } from './toHex.js'
