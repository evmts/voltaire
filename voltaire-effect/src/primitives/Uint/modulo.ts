/**
 * @fileoverview Effect-based Uint256 modulo operation.
 * @module modulo
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'
import type { UintError } from './from.js'

/**
 * Modulo operation on Uint256 values.
 * 
 * @description
 * Returns a % b. Fails if divisor is zero.
 * 
 * @param a - Dividend
 * @param b - Divisor
 * @returns Effect yielding remainder or UintError on modulo by zero
 * 
 * @example
 * ```typescript
 * const remainder = await Effect.runPromise(Uint.modulo(a, b))
 * ```
 * 
 * @since 0.0.1
 */
export const modulo = (a: Uint256Type, b: Uint256Type): Effect.Effect<Uint256Type, UintError> =>
  Effect.try({
    try: () => Uint256.modulo(a, b),
    catch: (e) => e as UintError
  })
