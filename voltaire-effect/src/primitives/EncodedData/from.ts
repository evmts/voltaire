import { EncodedData } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { EncodedDataType } from './EncodedDataSchema.js'

/**
 * Error thrown when encoded data operations fail.
 * @since 0.0.1
 */
export class EncodedDataError extends Error {
  readonly _tag = 'EncodedDataError'
  constructor(message: string) {
    super(message)
    this.name = 'EncodedDataError'
  }
}

/**
 * Creates EncodedData from hex string or bytes.
 *
 * @param value - Hex string or Uint8Array
 * @returns Effect yielding EncodedDataType or failing with EncodedDataError
 * @example
 * ```typescript
 * import * as EncodedData from 'voltaire-effect/EncodedData'
 * import { Effect } from 'effect'
 *
 * const program = EncodedData.from('0xa9059cbb...')
 * const data = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = (value: string | Uint8Array): Effect.Effect<EncodedDataType, EncodedDataError> =>
  Effect.try({
    try: () => EncodedData.from(value),
    catch: (e) => new EncodedDataError((e as Error).message)
  })

/**
 * Creates EncodedData from bytes.
 *
 * @param bytes - Uint8Array
 * @returns Effect yielding EncodedDataType or failing with EncodedDataError
 * @since 0.0.1
 */
export const fromBytes = (bytes: Uint8Array): Effect.Effect<EncodedDataType, EncodedDataError> =>
  Effect.try({
    try: () => EncodedData.fromBytes(bytes),
    catch: (e) => new EncodedDataError((e as Error).message)
  })

/**
 * Converts EncodedData to bytes.
 *
 * @param data - The encoded data
 * @returns Effect yielding Uint8Array
 * @since 0.0.1
 */
export const toBytes = (data: EncodedDataType): Effect.Effect<Uint8Array, never> =>
  Effect.succeed(EncodedData.toBytes(data))

/**
 * Compares two encoded data values for equality.
 *
 * @param a - First encoded data
 * @param b - Second encoded data
 * @returns Effect yielding true if equal
 * @since 0.0.1
 */
export const equals = (a: EncodedDataType, b: EncodedDataType): Effect.Effect<boolean, never> =>
  Effect.succeed(EncodedData.equals(a, b))
