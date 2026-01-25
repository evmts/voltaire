/**
 * @fileoverview Effect-based Uint256 division.
 * @module dividedBy
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'
import type { UintError } from './from.js'

/**
 * Divide two Uint256 values.
 * 
 * @description
 * Returns floor division (a / b). Fails if divisor is zero.
 * 
 * @param a - Dividend
 * @param b - Divisor
 * @returns Effect yielding quotient or UintError on division by zero
 * 
 * @example
 * ```typescript
 * const quotient = await Effect.runPromise(Uint.dividedBy(a, b))
 * ```
 * 
 * @since 0.0.1
 */
export const dividedBy = (a: Uint256Type, b: Uint256Type): Effect.Effect<Uint256Type, UintError> =>
  Effect.try({
    try: () => Uint256.dividedBy(a, b),
    catch: (e) => e as UintError
  })
