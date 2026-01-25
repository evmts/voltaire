/**
 * @fileoverview Generate random hash values.
 *
 * @module Hash/random
 * @since 0.0.1
 */
import * as Hash from '@tevm/voltaire/Hash'
import type { HashType } from '@tevm/voltaire/Hash'
import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Generate a random 32-byte hash.
 *
 * @description Uses crypto.getRandomValues to generate cryptographically
 * secure random bytes. Returns an Effect that fails if crypto API is unavailable.
 *
 * @returns {Effect.Effect<HashType, ValidationError>} Effect containing random hash,
 *   or ValidationError if crypto API is unavailable
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const randomHash = await Effect.runPromise(Hash.random())
 * ```
 *
 * @since 0.0.1
 */
export const random = (): Effect.Effect<HashType, ValidationError> =>
  Effect.try({
    try: () => Hash.random(),
    catch: (e) => e as ValidationError
  })
