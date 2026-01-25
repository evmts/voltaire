/**
 * @fileoverview Effect-based random Bytes generation.
 * @module random
 * @since 0.0.1
 */

import { Bytes as VoltaireBytes, type BytesType } from '@tevm/voltaire/Bytes'
import * as Effect from 'effect/Effect'

/**
 * Generates random Bytes of specified size.
 *
 * @param size - Number of random bytes to generate
 * @returns Effect yielding random BytesType
 *
 * @example
 * ```typescript
 * const random32 = Effect.runSync(Bytes.random(32))
 * ```
 *
 * @since 0.0.1
 */
export const random = (size: number): Effect.Effect<BytesType> =>
  Effect.sync(() => VoltaireBytes.random(size))
