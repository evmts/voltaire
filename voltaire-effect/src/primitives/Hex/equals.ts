/**
 * @fileoverview Hex equality check function.
 * Compares two hex strings for equality (case-insensitive).
 * @module voltaire-effect/primitives/Hex/equals
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import * as Effect from 'effect/Effect'

/**
 * Check if two hex strings are equal (case-insensitive).
 *
 * @description
 * Compares two hex strings for equality. The comparison is case-insensitive,
 * so '0xABCD' equals '0xabcd'. This operation is infallible.
 *
 * @param {HexType} hex - First hex string
 * @param {HexType} other - Second hex string to compare
 * @returns {Effect.Effect<boolean, never>} Effect that always succeeds with boolean result
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * const isEqual = await Effect.runPromise(Hex.equals('0xABCD', '0xabcd')) // true
 * const notEqual = await Effect.runPromise(Hex.equals('0x1234', '0x5678')) // false
 * ```
 *
 * @since 0.0.1
 */
export const equals = (hex: HexType, other: HexType): Effect.Effect<boolean, never> =>
  Effect.succeed(VoltaireHex.equals(hex, other))
