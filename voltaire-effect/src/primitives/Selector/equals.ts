/**
 * @fileoverview Effect-based Selector equality check.
 * @module equals
 * @since 0.0.1
 */

import { Selector } from '@tevm/voltaire'
import type { SelectorType } from './SelectorSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Compares two Selectors for equality.
 *
 * @param a - First selector
 * @param b - Second selector
 * @returns Effect containing true if selectors are equal
 *
 * @example
 * ```typescript
 * import * as Selector from 'voltaire-effect/primitives/Selector'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const a = yield* Selector.from('0xa9059cbb')
 *   const b = yield* Selector.fromSignature('transfer(address,uint256)')
 *   return yield* Selector.equals(a, b) // true
 * })
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: SelectorType, b: SelectorType): Effect.Effect<boolean> =>
  Effect.sync(() => Selector.equals(
    a as unknown as Parameters<typeof Selector.equals>[0],
    b as unknown as Parameters<typeof Selector.equals>[0]
  ))
