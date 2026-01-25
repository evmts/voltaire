/**
 * @fileoverview Effect-wrapped toHex for PublicKey.
 * @module toHex
 * @since 0.0.1
 */

import { _toHex, type PublicKeyType } from '@tevm/voltaire/PublicKey'
import * as Effect from 'effect/Effect'

/**
 * Converts a PublicKey to hex string.
 * 
 * @param publicKey - The public key to convert
 * @returns Effect yielding hex string with "0x" prefix
 * 
 * @example
 * ```typescript
 * const hex = Effect.runSync(PublicKey.toHex(pk))
 * ```
 * 
 * @since 0.0.1
 */
export const toHex = (publicKey: PublicKeyType): Effect.Effect<string> =>
  Effect.sync(() => _toHex.call(publicKey as unknown as Parameters<typeof _toHex>[0]))
