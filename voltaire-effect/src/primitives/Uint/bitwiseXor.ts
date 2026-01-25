/**
 * @fileoverview Effect-based Uint256 bitwise XOR.
 * @module bitwiseXor
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Bitwise XOR of two Uint256 values.
 * 
 * @param a - First value
 * @param b - Second value
 * @returns Effect yielding a ^ b
 * 
 * @example
 * ```typescript
 * const result = Effect.runSync(Uint.bitwiseXor(a, b))
 * ```
 * 
 * @since 0.0.1
 */
export const bitwiseXor = (a: Uint256Type, b: Uint256Type): Effect.Effect<Uint256Type> =>
  Effect.sync(() => Uint256.bitwiseXor(a, b))
