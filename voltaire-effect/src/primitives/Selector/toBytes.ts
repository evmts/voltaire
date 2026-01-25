/**
 * @fileoverview Convert Selector to bytes.
 * @module toBytes
 * @since 0.0.1
 */

import type { SelectorType } from './SelectorSchema.js'

/**
 * Converts a Selector to its byte representation.
 *
 * Since SelectorType is a branded Uint8Array, this returns the selector itself.
 * Provided for API consistency with other primitives.
 *
 * @param selector - The selector to convert
 * @returns 4-byte Uint8Array
 *
 * @example
 * ```typescript
 * import * as Selector from 'voltaire-effect/primitives/Selector'
 *
 * const bytes = Selector.toBytes(selector)
 * // bytes is Uint8Array(4)
 * ```
 *
 * @since 0.0.1
 */
export const toBytes = (selector: SelectorType): Uint8Array => selector
