/**
 * @fileoverview Creates Signature from DER-encoded bytes with Effect error handling.
 * @module Signature/fromDER
 * @since 0.0.1
 */
import { Signature, type SignatureType, type SignatureAlgorithm, InvalidDERError } from '@tevm/voltaire/Signature'
import * as Effect from 'effect/Effect'

/**
 * Creates a Signature from DER-encoded ECDSA signature.
 *
 * @param der - DER-encoded signature bytes
 * @param algorithm - Algorithm (secp256k1 or p256)
 * @param v - Optional recovery ID for secp256k1
 * @returns Effect containing the SignatureType on success
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * const sig = await Effect.runPromise(
 *   Signature.fromDER(derBytes, 'secp256k1', 27)
 * )
 * ```
 *
 * @since 0.0.1
 */
export const fromDER = (
  der: Uint8Array,
  algorithm: SignatureAlgorithm,
  v?: number
): Effect.Effect<SignatureType, InvalidDERError> =>
  Effect.try({
    try: () => Signature.fromDER(der, algorithm, v),
    catch: (e) => e as InvalidDERError
  })
