/**
 * @fileoverview Convert Selector to hex string.
 * @module toHex
 * @since 0.0.1
 */

import { Selector } from '@tevm/voltaire'
import type { SelectorType } from './SelectorSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Converts a Selector to its hex string representation.
 *
 * @param selector - The selector to convert
 * @returns Effect containing the hex string with 0x prefix
 *
 * @example
 * ```typescript
 * import * as Selector from 'voltaire-effect/primitives/Selector'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const selector = yield* Selector.from('0xa9059cbb')
 *   const hex = yield* Selector.toHex(selector)
 *   return hex // '0xa9059cbb'
 * })
 * ```
 *
 * @since 0.0.1
 */
export const toHex = (selector: SelectorType): Effect.Effect<string> =>
  Effect.sync(() => Selector.toHex(selector as unknown as Parameters<typeof Selector.toHex>[0]))
