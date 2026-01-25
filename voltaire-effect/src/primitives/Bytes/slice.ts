/**
 * @fileoverview Effect-based Bytes slicing.
 * @module slice
 * @since 0.0.1
 */

import { Bytes as VoltaireBytes, type BytesType } from '@tevm/voltaire/Bytes'
import * as Effect from 'effect/Effect'

/**
 * Slices Bytes.
 *
 * @param bytes - Bytes to slice
 * @param start - Start index
 * @param end - End index (optional)
 * @returns Effect yielding sliced BytesType
 *
 * @example
 * ```typescript
 * const slice = await Effect.runPromise(Bytes.slice(bytes, 0, 4))
 * ```
 *
 * @since 0.0.1
 */
export const slice = (bytes: BytesType, start: number, end?: number): Effect.Effect<BytesType, Error> =>
  Effect.try({
    try: () => VoltaireBytes.slice(bytes, start, end),
    catch: (e) => e as Error
  })
