/**
 * @fileoverview Effect-wrapped isCompressed for PublicKey.
 * @module isCompressed
 * @since 0.0.1
 */

import { PublicKey } from '@tevm/voltaire/PublicKey'
import * as Effect from 'effect/Effect'

/**
 * Checks if a public key is in compressed format.
 * 
 * @description
 * Returns true for 33 bytes with 0x02/0x03 prefix, false otherwise.
 * 
 * @param bytes - Public key bytes
 * @returns Effect yielding boolean
 * 
 * @example
 * ```typescript
 * const isComp = Effect.runSync(PublicKey.isCompressed(bytes))
 * ```
 * 
 * @since 0.0.1
 */
export const isCompressed = (bytes: Uint8Array): Effect.Effect<boolean> =>
  Effect.sync(() => PublicKey.isCompressed(bytes))
