/**
 * @fileoverview Effect-based Selector creation from hex string.
 * @module fromHex
 * @since 0.0.1
 */

import { Selector } from '@tevm/voltaire'
import type { SelectorType } from './SelectorSchema.js'
import { SelectorError } from './SelectorError.js'
import * as Effect from 'effect/Effect'

/**
 * Creates a Selector from a hex string.
 *
 * @param hex - The hex string (with or without 0x prefix)
 * @returns Effect containing the Selector or a SelectorError
 *
 * @example
 * ```typescript
 * import * as Selector from 'voltaire-effect/primitives/Selector'
 *
 * const selector = Selector.fromHex('0xa9059cbb')
 * const selector2 = Selector.fromHex('a9059cbb')
 * ```
 *
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<SelectorType, SelectorError> =>
  Effect.try({
    try: () => Selector.fromHex(hex) as unknown as SelectorType,
    catch: (e) => new SelectorError((e as Error).message)
  })
