/**
 * @fileoverview Hex validation function with Effect error handling.
 * Validates and returns a hex string or fails with error.
 * @module voltaire-effect/primitives/Hex/validate
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import { InvalidFormatError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Validate a string as hex and return it as HexType.
 *
 * @description
 * Validates that a string is a properly formatted hex string with 0x prefix
 * and valid hex characters. Returns the validated hex on success, or fails
 * with InvalidFormatError if invalid.
 *
 * @param {string} value - String to validate
 * @returns {Effect.Effect<HexType, InvalidFormatError>} Effect yielding validated hex,
 *   or failing with InvalidFormatError
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * const valid = await Effect.runPromise(Hex.validate('0x1234')) // '0x1234'
 *
 * // Handle validation failure
 * const result = await Effect.runPromise(
 *   Hex.validate('invalid').pipe(
 *     Effect.catchTag('InvalidFormatError', () => Effect.succeed('0x'))
 *   )
 * )
 * ```
 *
 * @since 0.0.1
 */
export const validate = (value: string): Effect.Effect<HexType, InvalidFormatError> =>
  Effect.try({
    try: () => VoltaireHex.validate(value),
    catch: (e) => {
      if (e instanceof InvalidFormatError) return e
      return new InvalidFormatError(
        e instanceof Error ? e.message : String(e),
        { value, expected: 'valid hex string with 0x prefix', cause: e instanceof Error ? e : undefined }
      )
    }
  })
