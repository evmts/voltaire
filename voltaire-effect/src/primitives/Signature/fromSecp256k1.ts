/**
 * @fileoverview Creates Signature from secp256k1 components with Effect error handling.
 * @module Signature/fromSecp256k1
 * @since 0.0.1
 */
import { Signature, type SignatureType, InvalidSignatureLengthError } from '@tevm/voltaire/Signature'
import * as Effect from 'effect/Effect'

/**
 * Creates a secp256k1 Signature from r, s components.
 *
 * @param r - The r component (32 bytes)
 * @param s - The s component (32 bytes)
 * @param v - Optional recovery ID (27 or 28)
 * @returns Effect containing the SignatureType on success
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * const sig = await Effect.runPromise(
 *   Signature.fromSecp256k1(r, s, 27)
 * )
 * ```
 *
 * @since 0.0.1
 */
export const fromSecp256k1 = (
  r: Uint8Array,
  s: Uint8Array,
  v?: number
): Effect.Effect<SignatureType, InvalidSignatureLengthError> =>
  Effect.try({
    try: () => Signature.fromSecp256k1(r, s, v),
    catch: (e) => e as InvalidSignatureLengthError
  })
