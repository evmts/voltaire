/**
 * @fileoverview Effect-based Uint256 to ABI-encoded bytes.
 * @module toAbiEncoded
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Converts a Uint256 to ABI-encoded bytes (32 bytes, big-endian).
 * 
 * @param uint - The Uint256 to convert
 * @returns Effect yielding 32-byte Uint8Array
 * 
 * @example
 * ```typescript
 * const encoded = Effect.runSync(Uint.toAbiEncoded(uint))
 * ```
 * 
 * @since 0.0.1
 */
export const toAbiEncoded = (uint: Uint256Type): Effect.Effect<Uint8Array> =>
  Effect.sync(() => Uint256.toAbiEncoded(uint))
