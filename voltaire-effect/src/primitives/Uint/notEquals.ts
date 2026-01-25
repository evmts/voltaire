/**
 * @fileoverview Effect-based Uint256 inequality check.
 * @module notEquals
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Checks if two Uint256 values are not equal.
 * 
 * @param a - First value
 * @param b - Second value
 * @returns Effect yielding boolean (a !== b)
 * 
 * @example
 * ```typescript
 * const areNotEqual = Effect.runSync(Uint.notEquals(a, b))
 * ```
 * 
 * @since 0.0.1
 */
export const notEquals = (a: Uint256Type, b: Uint256Type): Effect.Effect<boolean> =>
  Effect.sync(() => Uint256.notEquals(a, b))
