import { RuntimeCode } from '@tevm/voltaire'
import type { RuntimeCodeType } from './RuntimeCodeSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when RuntimeCode creation fails.
 *
 * @example
 * ```typescript
 * import { RuntimeCodeError } from 'voltaire-effect/primitives/RuntimeCode'
 *
 * const error = new RuntimeCodeError('Invalid bytecode')
 * console.log(error._tag) // 'RuntimeCodeError'
 * ```
 *
 * @since 0.0.1
 */
export class RuntimeCodeError {
  /** Discriminant tag for error identification */
  readonly _tag = 'RuntimeCodeError'
  /**
   * Creates a new RuntimeCodeError.
   * @param message - Error description
   */
  constructor(readonly message: string) {}
}

/**
 * Creates RuntimeCode from a hex string or bytes using Effect for error handling.
 *
 * @param value - Bytecode as hex string or Uint8Array
 * @returns Effect that succeeds with RuntimeCodeType or fails with RuntimeCodeError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from 'voltaire-effect/primitives/RuntimeCode'
 *
 * const code = from('0x6080604052...')
 * Effect.runSync(code)
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: string | Uint8Array): Effect.Effect<RuntimeCodeType, RuntimeCodeError> =>
  Effect.try({
    try: () => RuntimeCode.from(value),
    catch: (e) => new RuntimeCodeError((e as Error).message)
  })

/**
 * Creates RuntimeCode from a hex string using Effect for error handling.
 *
 * @param value - Bytecode as hex string (with or without 0x prefix)
 * @returns Effect that succeeds with RuntimeCodeType or fails with RuntimeCodeError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { fromHex } from 'voltaire-effect/primitives/RuntimeCode'
 *
 * const code = fromHex('0x6080604052...')
 * Effect.runSync(code)
 * ```
 *
 * @since 0.0.1
 */
export const fromHex = (value: string): Effect.Effect<RuntimeCodeType, RuntimeCodeError> =>
  Effect.try({
    try: () => RuntimeCode.fromHex(value),
    catch: (e) => new RuntimeCodeError((e as Error).message)
  })
