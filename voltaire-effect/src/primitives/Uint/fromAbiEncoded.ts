/**
 * @fileoverview Effect-based Uint256 from ABI-encoded bytes.
 * @module fromAbiEncoded
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'
import type { UintError } from './from.js'

/**
 * Creates a Uint256 from ABI-encoded bytes (32 bytes, big-endian).
 * 
 * @param data - 32-byte Uint8Array
 * @returns Effect yielding Uint256 or UintError if invalid
 * 
 * @example
 * ```typescript
 * const uint = await Effect.runPromise(Uint.fromAbiEncoded(encoded))
 * ```
 * 
 * @since 0.0.1
 */
export const fromAbiEncoded = (data: Uint8Array): Effect.Effect<Uint256Type, UintError> =>
  Effect.try({
    try: () => Uint256.fromAbiEncoded(data),
    catch: (e) => e as UintError
  })
