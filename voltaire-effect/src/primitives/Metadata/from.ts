import { Metadata } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * The Metadata type representing contract metadata.
 * @since 0.0.1
 */
type MetadataType = ReturnType<typeof Metadata.from>

/**
 * Error thrown when Metadata parsing fails due to invalid input.
 *
 * @example
 * ```typescript
 * import * as Metadata from 'voltaire-effect/Metadata'
 * import * as Effect from 'effect/Effect'
 *
 * const result = Metadata.from(new Uint8Array([]))
 * Effect.runSync(Effect.either(result))
 * // Left(MetadataError { message: '...' })
 * ```
 *
 * @since 0.0.1
 */
export class MetadataError extends Error {
  readonly _tag = 'MetadataError'
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'MetadataError'
  }
}

/**
 * Creates a Metadata from a Uint8Array, wrapped in an Effect.
 * Contract metadata is CBOR-encoded data at the end of contract bytecode.
 *
 * @param raw - The raw metadata bytes as a Uint8Array
 * @returns An Effect that resolves to MetadataType or fails with MetadataError
 *
 * @example
 * ```typescript
 * import * as Metadata from 'voltaire-effect/Metadata'
 * import * as Effect from 'effect/Effect'
 *
 * const metadataBytes = new Uint8Array([0xa2, 0x64, 0x69, 0x70, 0x66, 0x73])
 * const metadata = Effect.runSync(Metadata.from(metadataBytes))
 * ```
 *
 * @since 0.0.1
 */
export function from(raw: Uint8Array): Effect.Effect<MetadataType, MetadataError> {
  return Effect.try({
    try: () => Metadata.from(raw),
    catch: (e) => new MetadataError((e as Error).message, e)
  })
}
