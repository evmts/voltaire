/**
 * @fileoverview Effect-based Uint256 multiplication with wrapping.
 * @module times
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Multiply two Uint256 values with wrapping.
 * 
 * @description
 * Result is (a * b) mod 2^256. Does not throw on overflow.
 * 
 * @param a - First operand
 * @param b - Second operand
 * @returns Effect yielding product
 * 
 * @example
 * ```typescript
 * const product = Effect.runSync(Uint.times(a, b))
 * ```
 * 
 * @since 0.0.1
 */
export const times = (a: Uint256Type, b: Uint256Type): Effect.Effect<Uint256Type> =>
  Effect.sync(() => Uint256.times(a, b))
