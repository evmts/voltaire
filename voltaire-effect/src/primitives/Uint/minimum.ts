/**
 * @fileoverview Effect-based Uint256 minimum.
 * @module minimum
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Returns the minimum of two Uint256 values.
 * 
 * @param a - First value
 * @param b - Second value
 * @returns Effect yielding min(a, b)
 * 
 * @example
 * ```typescript
 * const min = Effect.runSync(Uint.minimum(a, b))
 * ```
 * 
 * @since 0.0.1
 */
export const minimum = (a: Uint256Type, b: Uint256Type): Effect.Effect<Uint256Type> =>
  Effect.sync(() => Uint256.minimum(a, b))
