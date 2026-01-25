/**
 * @fileoverview Clone a hash value.
 *
 * @module Hash/clone
 * @since 0.0.1
 */
import * as Hash from '@tevm/voltaire/Hash'
import type { HashType } from '@tevm/voltaire/Hash'
import * as Effect from 'effect/Effect'

/**
 * Clone a hash value.
 *
 * @description Creates a new HashType with the same bytes as the input.
 * This is a pure synchronous function that never fails.
 *
 * @param {HashType} hash - Hash to clone
 * @returns {Effect.Effect<HashType>} Effect containing the cloned hash
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const copy = Effect.runSync(Hash.clone(original))
 * ```
 *
 * @since 0.0.1
 */
export const clone = (hash: HashType): Effect.Effect<HashType> =>
  Effect.sync(() => Hash.clone(hash))
