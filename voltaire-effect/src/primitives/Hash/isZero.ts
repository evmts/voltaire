/**
 * @fileoverview Check if hash is the zero hash.
 *
 * @module Hash/isZero
 * @since 0.0.1
 */
import * as Hash from '@tevm/voltaire/Hash'
import type { HashType } from '@tevm/voltaire/Hash'
import * as Effect from 'effect/Effect'

/**
 * Check if hash is the zero hash (all zeros).
 *
 * @description Uses constant-time comparison to prevent timing attacks.
 * This is a pure synchronous function that never fails.
 *
 * @param {HashType} hash - Hash to check
 * @returns {Effect.Effect<boolean>} Effect containing true if hash is all zeros
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const isZeroHash = Effect.runSync(Hash.isZero(hash))
 * ```
 *
 * @since 0.0.1
 */
export const isZero = (hash: HashType): Effect.Effect<boolean> =>
  Effect.sync(() => Hash.isZero(hash))
