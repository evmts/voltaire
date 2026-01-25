/**
 * @fileoverview Effect-based Uint256 population count.
 * @module popCount
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Returns the number of set bits (1s) in this Uint256.
 * 
 * @param uint - Value to measure
 * @returns Effect yielding number of set bits
 * 
 * @example
 * ```typescript
 * const count = Effect.runSync(Uint.popCount(uint))
 * ```
 * 
 * @since 0.0.1
 */
export const popCount = (uint: Uint256Type): Effect.Effect<number> =>
  Effect.sync(() => Uint256.popCount(uint))
