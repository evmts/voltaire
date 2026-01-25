/**
 * @fileoverview Effect-based private key to hex conversion.
 * @module toHex
 * @since 0.0.1
 */

import { _toHex, type PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import * as Effect from 'effect/Effect'

/**
 * Converts a PrivateKey to hex string.
 * 
 * @param privateKey - The private key to convert
 * @returns Effect yielding hex string with "0x" prefix
 * 
 * @example
 * ```typescript
 * const hex = Effect.runSync(PrivateKey.toHex(pk))
 * // "0x0123456789abcdef..."
 * ```
 * 
 * @since 0.0.1
 */
export const toHex = (privateKey: PrivateKeyType): Effect.Effect<string> =>
  Effect.sync(() => _toHex.call(privateKey))
