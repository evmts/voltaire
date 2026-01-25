import { ReturnData } from '@tevm/voltaire'
import type { ReturnDataType } from './ReturnDataSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when ReturnData creation fails.
 *
 * @example
 * ```typescript
 * import { ReturnDataError } from 'voltaire-effect/primitives/ReturnData'
 *
 * const error = new ReturnDataError('Invalid hex string')
 * console.log(error._tag) // 'ReturnDataError'
 * ```
 *
 * @since 0.0.1
 */
export class ReturnDataError {
  /** Discriminant tag for error identification */
  readonly _tag = 'ReturnDataError'
  /**
   * Creates a new ReturnDataError.
   * @param message - Error description
   */
  constructor(readonly message: string) {}
}

/**
 * Creates ReturnData from a hex string or bytes using Effect for error handling.
 *
 * @param value - Hex string or Uint8Array
 * @returns Effect that succeeds with ReturnDataType or fails with ReturnDataError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from 'voltaire-effect/primitives/ReturnData'
 *
 * const data = from('0xabcd1234')
 * Effect.runSync(data)
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: string | Uint8Array): Effect.Effect<ReturnDataType, ReturnDataError> =>
  Effect.try({
    try: () => ReturnData.from(value),
    catch: (e) => new ReturnDataError((e as Error).message)
  })

/**
 * Creates ReturnData from a hex string using Effect for error handling.
 *
 * @param value - Hex string (with or without 0x prefix)
 * @returns Effect that succeeds with ReturnDataType or fails with ReturnDataError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { fromHex } from 'voltaire-effect/primitives/ReturnData'
 *
 * const data = fromHex('0xabcd1234')
 * Effect.runSync(data)
 * ```
 *
 * @since 0.0.1
 */
export const fromHex = (value: string): Effect.Effect<ReturnDataType, ReturnDataError> =>
  Effect.try({
    try: () => ReturnData.fromHex(value),
    catch: (e) => new ReturnDataError((e as Error).message)
  })

/**
 * Creates ReturnData from bytes using Effect for error handling.
 *
 * @param value - Uint8Array of bytes
 * @returns Effect that succeeds with ReturnDataType or fails with ReturnDataError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { fromBytes } from 'voltaire-effect/primitives/ReturnData'
 *
 * const data = fromBytes(new Uint8Array([0xab, 0xcd]))
 * Effect.runSync(data)
 * ```
 *
 * @since 0.0.1
 */
export const fromBytes = (value: Uint8Array): Effect.Effect<ReturnDataType, ReturnDataError> =>
  Effect.try({
    try: () => ReturnData.fromBytes(value),
    catch: (e) => new ReturnDataError((e as Error).message)
  })
