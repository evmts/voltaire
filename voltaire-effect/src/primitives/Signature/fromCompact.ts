/**
 * @fileoverview Creates Signature from compact format with Effect error handling.
 * @module Signature/fromCompact
 * @since 0.0.1
 */
import { Signature, type SignatureType, type SignatureAlgorithm, InvalidSignatureLengthError } from '@tevm/voltaire/Signature'
import * as Effect from 'effect/Effect'

/**
 * Creates a Signature from compact format (EIP-2098: yParity in bit 255 of s).
 *
 * @param bytes - Compact signature bytes (64 or 65 bytes)
 * @param algorithmOrV - Algorithm or explicit v value
 * @returns Effect containing the SignatureType on success
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * const sig = await Effect.runPromise(
 *   Signature.fromCompact(bytes64, 'secp256k1')
 * )
 * ```
 *
 * @since 0.0.1
 */
export const fromCompact = (
  bytes: Uint8Array,
  algorithmOrV: SignatureAlgorithm | number
): Effect.Effect<SignatureType, InvalidSignatureLengthError> =>
  Effect.try({
    try: () => Signature.fromCompact(bytes, algorithmOrV),
    catch: (e) => e as InvalidSignatureLengthError
  })
