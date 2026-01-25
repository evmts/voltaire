/**
 * @fileoverview Effect-based Selector creation from various input types.
 * @module from
 * @since 0.0.1
 */

import { Selector } from '@tevm/voltaire'
import type { SelectorType } from './SelectorSchema.js'
import { SelectorError } from './SelectorError.js'
import * as Effect from 'effect/Effect'

/**
 * Union type representing valid inputs for creating a Selector.
 * @since 0.0.1
 */
export type SelectorLike = SelectorType | string | Uint8Array

/**
 * Creates a Selector from a hex string, Uint8Array, or existing SelectorType.
 *
 * @param value - The value to convert to a Selector
 * @returns Effect containing the Selector or a SelectorError
 *
 * @example
 * ```typescript
 * import * as Selector from 'voltaire-effect/primitives/Selector'
 *
 * const selector = Selector.from('0xa9059cbb')
 * const fromBytes = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]))
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: SelectorLike): Effect.Effect<SelectorType, SelectorError> =>
  Effect.try({
    try: () => Selector.from(value) as unknown as SelectorType,
    catch: (e) => new SelectorError((e as Error).message)
  })
