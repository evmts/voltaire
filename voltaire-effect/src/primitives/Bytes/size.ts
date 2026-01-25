/**
 * @fileoverview Effect-based Bytes size retrieval.
 * @module size
 * @since 0.0.1
 */

import { Bytes as VoltaireBytes, type BytesType } from '@tevm/voltaire/Bytes'
import * as Effect from 'effect/Effect'

/**
 * Gets the size of Bytes.
 *
 * @param bytes - Bytes to measure
 * @returns Effect yielding size in bytes
 *
 * @example
 * ```typescript
 * const len = Effect.runSync(Bytes.size(bytes))
 * ```
 *
 * @since 0.0.1
 */
export const size = (bytes: BytesType): Effect.Effect<number> =>
  Effect.sync(() => VoltaireBytes.size(bytes))
