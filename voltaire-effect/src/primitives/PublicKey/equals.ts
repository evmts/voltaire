/**
 * @fileoverview Effect-wrapped equals for PublicKey.
 * @module equals
 * @since 0.0.1
 */

import type { PublicKeyType } from '@tevm/voltaire/PublicKey'
import * as Effect from 'effect/Effect'

/**
 * Checks if two public keys are equal.
 * 
 * @param a - First public key
 * @param b - Second public key
 * @returns Effect yielding boolean
 * 
 * @example
 * ```typescript
 * const areEqual = Effect.runSync(PublicKey.equals(pk1, pk2))
 * ```
 * 
 * @since 0.0.1
 */
export const equals = (a: PublicKeyType, b: PublicKeyType): Effect.Effect<boolean> =>
  Effect.sync(() => {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false
    }
    return true
  })
