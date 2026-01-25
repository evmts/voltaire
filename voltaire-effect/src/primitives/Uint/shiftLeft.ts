/**
 * @fileoverview Effect-based Uint256 left shift.
 * @module shiftLeft
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Left shift a Uint256 value.
 * 
 * @param uint - Value to shift
 * @param bits - Number of bits to shift
 * @returns Effect yielding uint << bits (within 256-bit range)
 * 
 * @example
 * ```typescript
 * const result = Effect.runSync(Uint.shiftLeft(uint, bits))
 * ```
 * 
 * @since 0.0.1
 */
export const shiftLeft = (uint: Uint256Type, bits: Uint256Type): Effect.Effect<Uint256Type> =>
  Effect.sync(() => Uint256.shiftLeft(uint, bits))
