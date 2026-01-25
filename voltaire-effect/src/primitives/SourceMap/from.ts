import { SourceMap } from '@tevm/voltaire'
import type { SourceMapType, SourceMapEntry } from './SourceMapSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when source map parsing fails.
 *
 * @example
 * ```typescript
 * import { SourceMap } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * Effect.runPromise(SourceMap.from('invalid')).catch(e => {
 *   if (e._tag === 'SourceMapError') {
 *     console.error('SourceMap error:', e.message)
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export class SourceMapError {
  readonly _tag = 'SourceMapError'
  constructor(readonly message: string) {}
}

/**
 * Parses a Solidity source map from its raw string format.
 *
 * @param {string} raw - The raw source map string (semicolon-separated)
 * @returns {Effect.Effect<SourceMapType, SourceMapError>} Effect containing the parsed SourceMap or an error
 *
 * @example
 * ```typescript
 * import { SourceMap } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const sourceMap = SourceMap.from('0:10:0:-;10:5:0:i')
 * Effect.runPromise(sourceMap).then(console.log)
 * ```
 *
 * @since 0.0.1
 */
export const from = (raw: string): Effect.Effect<SourceMapType, SourceMapError> =>
  Effect.try({
    try: () => SourceMap.from(raw),
    catch: (e) => new SourceMapError((e as Error).message)
  })

/**
 * Converts a SourceMap back to its raw string format.
 *
 * @param {SourceMapType} sourceMap - The source map to convert
 * @returns {string} The raw source map string
 *
 * @example
 * ```typescript
 * import { SourceMap } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const sm = yield* SourceMap.from('0:10:0:-')
 *   return SourceMap.toString(sm)
 * })
 * ```
 *
 * @since 0.0.1
 */
export const toString = (sourceMap: SourceMapType): string => 
  SourceMap.toString(sourceMap as unknown as Parameters<typeof SourceMap.toString>[0])

/**
 * Extracts all entries from a SourceMap.
 *
 * @param {SourceMapType} sourceMap - The source map
 * @returns {readonly SourceMapEntry[]} Array of source map entries
 *
 * @example
 * ```typescript
 * import { SourceMap } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const sm = yield* SourceMap.from('0:10:0:-;10:5:0:i')
 *   const entries = SourceMap.toEntries(sm)
 *   console.log(entries.length) // 2
 * })
 * ```
 *
 * @since 0.0.1
 */
export const toEntries = (sourceMap: SourceMapType): readonly SourceMapEntry[] => 
  SourceMap.toEntries(sourceMap as unknown as Parameters<typeof SourceMap.toEntries>[0]) as readonly SourceMapEntry[]

/**
 * Gets a specific entry from a SourceMap by index.
 *
 * @param {SourceMapType} sourceMap - The source map
 * @param {number} index - The entry index
 * @returns {SourceMapEntry | undefined} The entry at the index, or undefined if out of bounds
 *
 * @example
 * ```typescript
 * import { SourceMap } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const sm = yield* SourceMap.from('0:10:0:-;10:5:0:i')
 *   const entry = SourceMap.getEntryAt(sm, 0)
 *   console.log(entry?.start) // 0
 * })
 * ```
 *
 * @since 0.0.1
 */
export const getEntryAt = (sourceMap: SourceMapType, index: number): SourceMapEntry | undefined => 
  SourceMap.getEntryAt(sourceMap as unknown as Parameters<typeof SourceMap.getEntryAt>[0], index) as SourceMapEntry | undefined
