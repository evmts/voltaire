/**
 * @fileoverview Effect-based private key to bytes conversion.
 * @module toBytes
 * @since 0.0.1
 */

import type { PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import * as Effect from 'effect/Effect'

/**
 * Returns the raw bytes of a PrivateKey.
 * 
 * @param privateKey - The private key to convert
 * @returns Effect yielding the 32-byte Uint8Array
 * 
 * @example
 * ```typescript
 * const bytes = Effect.runSync(PrivateKey.toBytes(pk))
 * // Uint8Array(32) [...]
 * ```
 * 
 * @since 0.0.1
 */
export const toBytes = (privateKey: PrivateKeyType): Effect.Effect<Uint8Array> =>
  Effect.sync(() => new Uint8Array(privateKey))
