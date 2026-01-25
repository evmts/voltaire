/**
 * @module SourceMap
 *
 * Effect-based module for working with Solidity source maps.
 * Source maps enable debugging by mapping EVM bytecode back to Solidity source code.
 *
 * @example
 * ```typescript
 * import { SourceMap } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const sm = yield* SourceMap.from('0:10:0:-;10:5:0:i')
 *   const entries = SourceMap.toEntries(sm)
 *   return entries
 * })
 * ```
 *
 * @since 0.0.1
 */
export { Schema, SourceMapEntrySchema, SourceMapTypeSchema, type SourceMapType, type SourceMapEntry } from './SourceMapSchema.js'
export { from, toString, toEntries, getEntryAt, SourceMapError } from './from.js'
