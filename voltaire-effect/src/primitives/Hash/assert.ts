/**
 * @fileoverview Assert value is a Hash.
 *
 * @module Hash/assert
 * @since 0.0.1
 */
import * as Hash from '@tevm/voltaire/Hash'
import type { HashType } from '@tevm/voltaire/Hash'
import { InvalidFormatError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Assert value is a Hash, fails if not.
 *
 * @description Validates that the value is a 32-byte Uint8Array.
 * Returns an Effect that fails with InvalidFormatError if invalid.
 *
 * @param {unknown} value - Value to assert
 * @param {string} [message] - Optional error message
 * @returns {Effect.Effect<HashType, InvalidFormatError>} Effect containing the hash on success
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const hash = yield* Hash.assert(someValue)
 *   // hash is now typed as HashType
 * })
 * ```
 *
 * @since 0.0.1
 */
export const assert = (value: unknown, message?: string): Effect.Effect<HashType, InvalidFormatError> =>
  Effect.try({
    try: () => {
      Hash.assert(value, message)
      return value as HashType
    },
    catch: (e) => e as InvalidFormatError
  })
