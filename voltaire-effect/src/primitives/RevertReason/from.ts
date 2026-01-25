import { RevertReason } from '@tevm/voltaire'
import type { RevertReasonType } from './RevertReasonSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when RevertReason parsing fails.
 *
 * @example
 * ```typescript
 * import { RevertReasonError } from 'voltaire-effect/primitives/RevertReason'
 *
 * const error = new RevertReasonError('Invalid revert data')
 * console.log(error._tag) // 'RevertReasonError'
 * ```
 *
 * @since 0.0.1
 */
export class RevertReasonError {
  /** Discriminant tag for error identification */
  readonly _tag = 'RevertReasonError'
  /**
   * Creates a new RevertReasonError.
   * @param message - Error description
   */
  constructor(readonly message: string) {}
}

/**
 * Parses revert data into a typed revert reason using Effect for error handling.
 *
 * @param value - Revert data as hex string or Uint8Array
 * @returns Effect that succeeds with RevertReasonType or fails with RevertReasonError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from 'voltaire-effect/primitives/RevertReason'
 *
 * const reason = from('0x08c379a0...')
 * Effect.runSync(reason) // { type: 'Error', message: '...' }
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: string | Uint8Array): Effect.Effect<RevertReasonType, RevertReasonError> =>
  Effect.try({
    try: () => RevertReason.from(value),
    catch: (e) => new RevertReasonError((e as Error).message)
  })

/**
 * Converts a revert reason to a human-readable string.
 *
 * @param reason - The parsed revert reason
 * @returns Human-readable description of the revert
 *
 * @example
 * ```typescript
 * import { toString, from } from 'voltaire-effect/primitives/RevertReason'
 * import * as Effect from 'effect/Effect'
 *
 * const reason = Effect.runSync(from(revertData))
 * console.log(toString(reason)) // 'Error: Insufficient balance'
 * ```
 *
 * @since 0.0.1
 */
export const toString = (reason: RevertReasonType): string => RevertReason.toString(reason)
