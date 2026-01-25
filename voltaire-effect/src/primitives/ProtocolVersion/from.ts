import { ProtocolVersion } from '@tevm/voltaire'
import type { ProtocolVersionType } from './ProtocolVersionSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when ProtocolVersion creation fails.
 *
 * @example
 * ```typescript
 * import { ProtocolVersionError } from 'voltaire-effect/primitives/ProtocolVersion'
 *
 * const error = new ProtocolVersionError('Invalid protocol version format')
 * console.log(error._tag) // 'ProtocolVersionError'
 * ```
 *
 * @since 0.0.1
 */
export class ProtocolVersionError {
  /** Discriminant tag for error identification */
  readonly _tag = 'ProtocolVersionError'
  /**
   * Creates a new ProtocolVersionError.
   * @param message - Error description
   */
  constructor(readonly message: string) {}
}

/**
 * Creates a ProtocolVersion from a string using Effect for error handling.
 *
 * @param value - Protocol version string (e.g., 'eth/66', 'eth/67')
 * @returns Effect that succeeds with ProtocolVersionType or fails with ProtocolVersionError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from 'voltaire-effect/primitives/ProtocolVersion'
 *
 * const version = from('eth/67')
 * Effect.runSync(version)
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: string): Effect.Effect<ProtocolVersionType, ProtocolVersionError> =>
  Effect.try({
    try: () => ProtocolVersion.from(value),
    catch: (e) => new ProtocolVersionError((e as Error).message)
  })
