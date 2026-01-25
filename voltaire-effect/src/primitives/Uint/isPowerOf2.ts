/**
 * @fileoverview Effect-based Uint256 power of 2 check.
 * @module isPowerOf2
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Checks if a Uint256 value is a power of 2.
 * 
 * @param uint - Value to check
 * @returns Effect yielding boolean
 * 
 * @example
 * ```typescript
 * const isPow2 = Effect.runSync(Uint.isPowerOf2(uint))
 * ```
 * 
 * @since 0.0.1
 */
export const isPowerOf2 = (uint: Uint256Type): Effect.Effect<boolean> =>
  Effect.sync(() => Uint256.isPowerOf2(uint))
