/**
 * @fileoverview Effect-based Uint256 equality check.
 * @module equals
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Checks if two Uint256 values are equal.
 * 
 * @param a - First value
 * @param b - Second value
 * @returns Effect yielding boolean
 * 
 * @example
 * ```typescript
 * const areEqual = Effect.runSync(Uint.equals(a, b))
 * ```
 * 
 * @since 0.0.1
 */
export const equals = (a: Uint256Type, b: Uint256Type): Effect.Effect<boolean> =>
  Effect.sync(() => Uint256.equals(a, b))
