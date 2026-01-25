/**
 * @fileoverview Effect-based Uint256 product.
 * @module product
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Product of multiple Uint256 values with wrapping.
 * 
 * @param values - Values to multiply
 * @returns Effect yielding product mod 2^256
 * 
 * @example
 * ```typescript
 * const result = Effect.runSync(Uint.product(a, b, c))
 * ```
 * 
 * @since 0.0.1
 */
export const product = (...values: Uint256Type[]): Effect.Effect<Uint256Type> =>
  Effect.sync(() => Uint256.product(...values))
