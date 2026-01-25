import { MemoryDump } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * The MemoryDump type representing EVM memory state.
 * @since 0.0.1
 */
type MemoryDumpType = ReturnType<typeof MemoryDump.from>

/**
 * Error thrown when MemoryDump parsing fails due to invalid input.
 *
 * @example
 * ```typescript
 * import * as MemoryDump from 'voltaire-effect/MemoryDump'
 * import * as Effect from 'effect/Effect'
 *
 * const result = MemoryDump.from({ data: 'invalid' })
 * Effect.runSync(Effect.either(result))
 * // Left(MemoryDumpError { message: '...' })
 * ```
 *
 * @since 0.0.1
 */
export class MemoryDumpError extends Error {
  readonly _tag = 'MemoryDumpError'
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'MemoryDumpError'
  }
}

/**
 * Creates a MemoryDump from a Uint8Array or object, wrapped in an Effect.
 * Memory dumps are used to capture EVM memory state during debugging.
 *
 * @param value - A Uint8Array or object with data and optional length
 * @returns An Effect that resolves to MemoryDumpType or fails with MemoryDumpError
 *
 * @example
 * ```typescript
 * import * as MemoryDump from 'voltaire-effect/MemoryDump'
 * import * as Effect from 'effect/Effect'
 *
 * // From Uint8Array
 * const dump = Effect.runSync(MemoryDump.from(new Uint8Array([0, 1, 2, 3])))
 *
 * // From object with explicit length
 * const dumpWithLength = Effect.runSync(MemoryDump.from({
 *   data: new Uint8Array([0, 1, 2, 3]),
 *   length: 4
 * }))
 * ```
 *
 * @since 0.0.1
 */
export function from(value: Uint8Array | { data: Uint8Array; length?: number }): Effect.Effect<MemoryDumpType, MemoryDumpError> {
  return Effect.try({
    try: () => MemoryDump.from(value),
    catch: (e) => new MemoryDumpError((e as Error).message, e)
  })
}
