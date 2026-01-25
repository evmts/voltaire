/**
 * @fileoverview Effect-based Bytes to UTF-8 string conversion.
 * @module toString
 * @since 0.0.1
 */

import { Bytes as VoltaireBytes, type BytesType } from '@tevm/voltaire/Bytes'
import * as Effect from 'effect/Effect'

/**
 * Converts Bytes to UTF-8 string.
 *
 * @param bytes - The bytes to decode
 * @returns Effect yielding UTF-8 string
 *
 * @example
 * ```typescript
 * const str = Effect.runSync(Bytes.toString(bytes))
 * // "hello"
 * ```
 *
 * @since 0.0.1
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional API name
export const toString = (bytes: BytesType): Effect.Effect<string> =>
  Effect.sync(() => VoltaireBytes.toString(bytes))
