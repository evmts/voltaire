import { Int256, BrandedInt256 } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * The branded Int256 type representing a signed 256-bit integer.
 * @since 0.0.1
 */
type Int256Type = BrandedInt256.BrandedInt256

/**
 * Error thrown when Int256 operations fail (overflow, underflow, or invalid input).
 *
 * @example
 * ```typescript
 * import * as Int256 from 'voltaire-effect/Int256'
 * import * as Effect from 'effect/Effect'
 *
 * const result = Int256.from('invalid')
 * Effect.runSync(Effect.either(result))
 * // Left(Int256Error { message: '...' })
 * ```
 *
 * @since 0.0.1
 */
export class Int256Error extends Error {
  readonly _tag = 'Int256Error'
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'Int256Error'
  }
}

/**
 * Creates an Int256 from a bigint, number, or string, wrapped in an Effect.
 *
 * @param value - The value to convert (must be in Int256 range)
 * @returns An Effect that resolves to Int256Type or fails with Int256Error
 *
 * @example
 * ```typescript
 * import * as Int256 from 'voltaire-effect/Int256'
 * import * as Effect from 'effect/Effect'
 *
 * const int256 = Effect.runSync(Int256.from(12345678901234567890123456789n))
 * const fromString = Effect.runSync(Int256.from('-999999999999999999999999999'))
 * ```
 *
 * @since 0.0.1
 */
export function from(value: bigint | number | string): Effect.Effect<Int256Type, Int256Error> {
  return Effect.try({
    try: () => Int256(value),
    catch: (e) => new Int256Error((e as Error).message, e)
  })
}

/**
 * Creates an Int256 from a hexadecimal string, wrapped in an Effect.
 *
 * @param value - The hex string (with or without 0x prefix)
 * @returns An Effect that resolves to Int256Type or fails with Int256Error
 *
 * @example
 * ```typescript
 * import * as Int256 from 'voltaire-effect/Int256'
 * import * as Effect from 'effect/Effect'
 *
 * const int256 = Effect.runSync(Int256.fromHex('0x7fffffff'))
 * ```
 *
 * @since 0.0.1
 */
export function fromHex(value: string): Effect.Effect<Int256Type, Int256Error> {
  return Effect.try({
    try: () => Int256.fromHex(value),
    catch: (e) => new Int256Error((e as Error).message, e)
  })
}

/**
 * Creates an Int256 from a bigint, wrapped in an Effect.
 *
 * @param value - The bigint value (must be in Int256 range)
 * @returns An Effect that resolves to Int256Type or fails with Int256Error
 *
 * @example
 * ```typescript
 * import * as Int256 from 'voltaire-effect/Int256'
 * import * as Effect from 'effect/Effect'
 *
 * const int256 = Effect.runSync(Int256.fromBigInt(12345678901234567890123456789n))
 * ```
 *
 * @since 0.0.1
 */
export function fromBigInt(value: bigint): Effect.Effect<Int256Type, Int256Error> {
  return Effect.try({
    try: () => Int256.fromBigInt(value),
    catch: (e) => new Int256Error((e as Error).message, e)
  })
}
