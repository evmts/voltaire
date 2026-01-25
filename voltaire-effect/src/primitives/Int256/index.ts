/**
 * Int256 module for working with signed 256-bit integers in Effect.
 * This is the native signed integer type used in Solidity (int256).
 *
 * @example
 * ```typescript
 * import * as Int256 from 'voltaire-effect/Int256'
 * import * as Effect from 'effect/Effect'
 *
 * // Create Int256 values
 * const value = Effect.runSync(Int256.from(12345678901234567890123456789n))
 *
 * // From hex string
 * const fromHex = Effect.runSync(Int256.fromHex('0x7fffffff'))
 * ```
 *
 * @since 0.0.1
 * @module
 */
export { Int256Schema, Int256FromHexSchema } from './Int256Schema.js'
export { from, fromHex, fromBigInt, Int256Error } from './from.js'
