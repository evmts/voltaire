/**
 * @fileoverview Effect-based Uint256 min of variadic args.
 * @module min
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Returns the minimum of multiple Uint256 values.
 * 
 * @param values - Values to compare
 * @returns Effect yielding minimum value
 * 
 * @example
 * ```typescript
 * const min = Effect.runSync(Uint.min(a, b, c))
 * ```
 * 
 * @since 0.0.1
 */
export const min = (...values: Uint256Type[]): Effect.Effect<Uint256Type> =>
  Effect.sync(() => Uint256.min(...values))
