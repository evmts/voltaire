/**
 * @fileoverview Effect-based Uint256 greatest common divisor.
 * @module gcd
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Computes greatest common divisor of two Uint256 values.
 * 
 * @param a - First value
 * @param b - Second value
 * @returns Effect yielding gcd(a, b)
 * 
 * @example
 * ```typescript
 * const divisor = Effect.runSync(Uint.gcd(a, b))
 * ```
 * 
 * @since 0.0.1
 */
export const gcd = (a: Uint256Type, b: Uint256Type): Effect.Effect<Uint256Type> =>
  Effect.sync(() => Uint256.gcd(a, b))
