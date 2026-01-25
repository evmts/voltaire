/**
 * @fileoverview Effect-based Uint256 to hex conversion.
 * @module toHex
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Converts a Uint256 to hex string.
 * 
 * @param uint - The Uint256 to convert
 * @param padded - Whether to pad to 64 characters (32 bytes), default true
 * @returns Effect yielding hex string with "0x" prefix
 * 
 * @example
 * ```typescript
 * const hex = Effect.runSync(Uint.toHex(uint))
 * // "0x00000000000000000000000000000000000000000000000000000000000000ff"
 * 
 * const unpadded = Effect.runSync(Uint.toHex(uint, false))
 * // "0xff"
 * ```
 * 
 * @since 0.0.1
 */
export const toHex = (uint: Uint256Type, padded = true): Effect.Effect<string> =>
  Effect.sync(() => Uint256.toHex(uint, padded))
