/**
 * Block module for complete Ethereum blocks.
 * Provides Effect-based schema for block validation.
 * 
 * @example
 * ```typescript
 * import * as Block from 'voltaire-effect/primitives/Block'
 * import * as Schema from 'effect/Schema'
 * 
 * const validated = Schema.decodeSync(Block.Schema)(blockData)
 * ```
 * 
 * @since 0.0.1
 * @module
 */

export { BlockSchema, BlockSchema as Schema } from './BlockSchema.js'
