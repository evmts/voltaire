/**
 * @fileoverview Effect-based Bytes to hex conversion.
 * @module toHex
 * @since 0.0.1
 */

import { Bytes as VoltaireBytes, type BytesType } from '@tevm/voltaire/Bytes'
import type { HexType } from '@tevm/voltaire/Hex'
import * as Effect from 'effect/Effect'

/**
 * Converts Bytes to hex string.
 *
 * @param bytes - The bytes to convert
 * @returns Effect yielding hex string with "0x" prefix
 *
 * @example
 * ```typescript
 * const hex = Effect.runSync(Bytes.toHex(bytes))
 * // "0xdeadbeef"
 * ```
 *
 * @since 0.0.1
 */
export const toHex = (bytes: BytesType): Effect.Effect<HexType> =>
  Effect.sync(() => VoltaireBytes.toHex(bytes))
