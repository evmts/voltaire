/**
 * @fileoverview Hex type guard function.
 * Checks if a string is a valid hex format.
 * @module voltaire-effect/primitives/Hex/isHex
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import * as Effect from 'effect/Effect'

/**
 * Check if a string is a valid hex format.
 *
 * @description
 * Validates that a string is a properly formatted hex string with 0x prefix
 * and valid hex characters. Does not throw - returns a boolean. This operation
 * is infallible.
 *
 * @param {string} value - String to check
 * @returns {Effect.Effect<boolean, never>} Effect that always succeeds with boolean result
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * const valid = await Effect.runPromise(Hex.isHex('0x1234'))   // true
 * const noPrefix = await Effect.runPromise(Hex.isHex('1234')) // false
 * const invalid = await Effect.runPromise(Hex.isHex('0xZZZZ')) // false
 * ```
 *
 * @since 0.0.1
 */
export const isHex = (value: string): Effect.Effect<boolean, never> =>
  Effect.succeed(VoltaireHex.isHex(value))
