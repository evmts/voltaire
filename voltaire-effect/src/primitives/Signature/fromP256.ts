/**
 * @fileoverview Creates Signature from P-256 components with Effect error handling.
 * @module Signature/fromP256
 * @since 0.0.1
 */
import { Signature, type SignatureType, InvalidSignatureLengthError } from '@tevm/voltaire/Signature'
import * as Effect from 'effect/Effect'

/**
 * Creates a P-256 (secp256r1) Signature from r, s components.
 *
 * @param r - The r component (32 bytes)
 * @param s - The s component (32 bytes)
 * @returns Effect containing the SignatureType on success
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * const sig = await Effect.runPromise(
 *   Signature.fromP256(r, s)
 * )
 * ```
 *
 * @since 0.0.1
 */
export const fromP256 = (
  r: Uint8Array,
  s: Uint8Array
): Effect.Effect<SignatureType, InvalidSignatureLengthError> =>
  Effect.try({
    try: () => Signature.fromP256(r, s),
    catch: (e) => e as InvalidSignatureLengthError
  })
