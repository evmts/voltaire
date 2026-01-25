/**
 * @fileoverview Effect-based Bytes creation from hex string.
 * @module fromHex
 * @since 0.0.1
 */

import { Bytes as VoltaireBytes, type BytesType } from '@tevm/voltaire/Bytes'
import { InvalidFormatError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates Bytes from a hex string.
 *
 * @param hex - Hex string with "0x" prefix
 * @returns Effect yielding BytesType or failing with InvalidFormatError
 *
 * @example
 * ```typescript
 * const bytes = await Effect.runPromise(Bytes.fromHex('0xdeadbeef'))
 * // Uint8Array([0xde, 0xad, 0xbe, 0xef])
 * ```
 *
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<BytesType, InvalidFormatError> =>
  Effect.try({
    try: () => VoltaireBytes.fromHex(hex),
    catch: (e) => e as InvalidFormatError
  })
