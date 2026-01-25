/**
 * @fileoverview Effect-based Selector creation from function signature.
 * @module fromSignature
 * @since 0.0.1
 */

import { Selector } from '@tevm/voltaire'
import type { SelectorType } from './SelectorSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Creates a Selector from a function signature by hashing with keccak256.
 *
 * Takes first 4 bytes of keccak256(signature).
 *
 * @param signature - The function signature (e.g., "transfer(address,uint256)")
 * @returns Effect containing the Selector
 *
 * @example
 * ```typescript
 * import * as Selector from 'voltaire-effect/primitives/Selector'
 *
 * const selector = Selector.fromSignature('transfer(address,uint256)')
 * // Result: 0xa9059cbb
 * ```
 *
 * @since 0.0.1
 */
export const fromSignature = (signature: string): Effect.Effect<SelectorType> =>
  Effect.sync(() => Selector.fromSignature(signature) as unknown as SelectorType)
