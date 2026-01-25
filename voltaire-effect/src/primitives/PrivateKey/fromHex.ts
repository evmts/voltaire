/**
 * @fileoverview Effect-based private key creation from hex string.
 * @module fromHex
 * @since 0.0.1
 */

import { PrivateKey, type PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import { InvalidFormatError, InvalidLengthError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates a PrivateKey from a hex string.
 * 
 * @param hex - 64-character hex string (with or without 0x prefix)
 * @returns Effect yielding PrivateKeyType or failing with validation error
 * 
 * @example
 * ```typescript
 * const pk = Effect.runSync(PrivateKey.fromHex('0x0123456789abcdef...'))
 * ```
 * 
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<PrivateKeyType, InvalidFormatError | InvalidLengthError> =>
  Effect.try({
    try: () => PrivateKey.from(hex),
    catch: (e) => e as InvalidFormatError | InvalidLengthError
  })
