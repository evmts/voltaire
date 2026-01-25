/**
 * @fileoverview Effect-based Bytes creation from UTF-8 string.
 * @module fromString
 * @since 0.0.1
 */

import { Bytes as VoltaireBytes, type BytesType } from '@tevm/voltaire/Bytes'
import * as Effect from 'effect/Effect'

/**
 * Creates Bytes from a UTF-8 string.
 *
 * @param str - UTF-8 string to encode
 * @returns Effect yielding BytesType
 *
 * @example
 * ```typescript
 * const bytes = Effect.runSync(Bytes.fromString('hello'))
 * // Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f])
 * ```
 *
 * @since 0.0.1
 */
export const fromString = (str: string): Effect.Effect<BytesType> =>
  Effect.sync(() => VoltaireBytes.fromString(str))
