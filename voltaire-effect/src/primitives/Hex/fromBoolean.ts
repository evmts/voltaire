/**
 * @fileoverview Hex fromBoolean function.
 * Converts booleans to hex representation.
 * @module voltaire-effect/primitives/Hex/fromBoolean
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type Sized } from '@tevm/voltaire/Hex'
import * as Effect from 'effect/Effect'

/**
 * Creates a Hex value from a boolean.
 *
 * @description
 * Converts a boolean to a 1-byte hex representation. `true` becomes
 * `0x01` and `false` becomes `0x00`. This operation is infallible.
 *
 * The returned hex is typed as `Sized<1>` indicating it is exactly
 * 1 byte in size.
 *
 * @param {boolean} value - Boolean to convert to hex
 * @returns {Effect.Effect<Sized<1>, never>} Effect that always succeeds with a 1-byte hex
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * // true -> 0x01
 * const hex1 = await Effect.runPromise(Hex.fromBoolean(true)) // '0x01'
 *
 * // false -> 0x00
 * const hex2 = await Effect.runPromise(Hex.fromBoolean(false)) // '0x00'
 *
 * // Use in pipeline
 * const pipeline = Effect.gen(function* () {
 *   const flag = true
 *   const hex = yield* Hex.fromBoolean(flag)
 *   return hex
 * })
 * ```
 *
 * @see {@link toBoolean} - Convert Hex back to boolean
 * @see {@link fromNumber} - Convert numbers to hex
 *
 * @since 0.0.1
 */
export const fromBoolean = (value: boolean): Effect.Effect<Sized<1>, never> =>
  Effect.sync(() => VoltaireHex.fromBoolean(value))
