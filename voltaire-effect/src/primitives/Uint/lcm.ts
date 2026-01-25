/**
 * @fileoverview Effect-based Uint256 least common multiple.
 * @module lcm
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Computes least common multiple of two Uint256 values.
 * 
 * @param a - First value
 * @param b - Second value
 * @returns Effect yielding lcm(a, b)
 * 
 * @example
 * ```typescript
 * const multiple = Effect.runSync(Uint.lcm(a, b))
 * ```
 * 
 * @since 0.0.1
 */
export const lcm = (a: Uint256Type, b: Uint256Type): Effect.Effect<Uint256Type> =>
  Effect.sync(() => Uint256.lcm(a, b))
