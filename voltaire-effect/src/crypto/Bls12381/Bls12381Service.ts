/**
 * @fileoverview BLS12-381 cryptographic signature service for Effect-based applications.
 * Provides pairing-friendly curve operations for aggregate signatures used in Ethereum 2.0.
 * @module Bls12381Service
 * @since 0.0.1
 */

import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'
import type { InvalidScalarError, SignatureError } from '@tevm/voltaire/Bls12381'

/**
 * Shape interface for BLS12-381 cryptographic service operations.
 *
 * @description
 * Defines the contract for BLS12-381 signature operations including signing,
 * verification, and signature aggregation. BLS signatures enable efficient
 * aggregation of multiple signatures into a single compact signature.
 *
 * @see {@link Bls12381Service} - The service using this shape
 * @since 0.0.1
 */
export interface Bls12381ServiceShape {
  /**
   * Signs a message using BLS12-381 signature scheme.
   *
   * @description
   * Creates a 96-byte BLS signature on the BLS12-381 curve. BLS signatures
   * are unique in that they can be aggregated, making them ideal for
   * consensus protocols where many signatures need to be verified efficiently.
   *
   * @param message - The message bytes to sign (any length)
   * @param privateKey - The 32-byte private key scalar
   * @returns Effect containing the 96-byte BLS signature (G2 point)
   * @throws InvalidScalarError - When the private key is invalid
   * @throws SignatureError - When signing fails
   */
  readonly sign: (
    message: Uint8Array,
    privateKey: Uint8Array
  ) => Effect.Effect<Uint8Array, InvalidScalarError | SignatureError>

  /**
   * Verifies a BLS12-381 signature against a message and public key.
   *
   * @description
   * Validates a BLS signature using pairing operations. Verification confirms
   * that the signature was created by the holder of the corresponding private key.
   *
   * @param signature - The 96-byte BLS signature (G2 point)
   * @param message - The original message bytes
   * @param publicKey - The 48-byte public key (G1 point)
   * @returns Effect containing true if signature is valid, false otherwise
   * @throws SignatureError - When the signature or public key is malformed
   */
  readonly verify: (
    signature: Uint8Array,
    message: Uint8Array,
    publicKey: Uint8Array
  ) => Effect.Effect<boolean, SignatureError>

  /**
   * Aggregates multiple BLS signatures into a single signature.
   *
   * @description
   * Combines multiple BLS signatures into one that can verify all original
   * messages. This is the key feature of BLS signatures - n signatures can
   * be compressed into a single 96-byte signature.
   *
   * @param signatures - Array of 96-byte BLS signatures to aggregate
   * @returns Effect containing the aggregated 96-byte signature
   * @throws SignatureError - When any signature is malformed
   */
  readonly aggregate: (
    signatures: Uint8Array[]
  ) => Effect.Effect<Uint8Array, SignatureError>
}

/**
 * BLS12-381 cryptographic service for Effect-based applications.
 *
 * @description
 * BLS12-381 is a pairing-friendly elliptic curve used extensively in
 * Ethereum 2.0 and other proof-of-stake blockchains. Its key feature is
 * signature aggregation - multiple signatures can be combined into a single
 * compact signature that proves all original signers signed.
 *
 * Key features:
 * - Signature aggregation (n signatures → 1 signature)
 * - 48-byte public keys, 96-byte signatures
 * - Used in Ethereum 2.0 consensus layer
 * - Efficient batch verification
 * - Pairing-based cryptography for advanced protocols
 *
 * @example
 * ```typescript
 * import { Bls12381Service, Bls12381Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * // Complete BLS workflow with aggregation
 * const program = Effect.gen(function* () {
 *   const bls = yield* Bls12381Service
 *
 *   // Sign multiple messages
 *   const sig1 = yield* bls.sign(message1, privateKey1)
 *   const sig2 = yield* bls.sign(message2, privateKey2)
 *
 *   // Aggregate signatures
 *   const aggregatedSig = yield* bls.aggregate([sig1, sig2])
 *
 *   // Verify individual signature
 *   const isValid = yield* bls.verify(sig1, message1, publicKey1)
 *   return { aggregatedSig, isValid }
 * }).pipe(Effect.provide(Bls12381Live))
 *
 * const result = await Effect.runPromise(program)
 * ```
 *
 * @see {@link Bls12381Live} - Production layer using native BLS12-381
 * @see {@link sign} - Standalone sign function
 * @see {@link verify} - Standalone verify function
 * @see {@link aggregate} - Standalone aggregation function
 * @since 0.0.1
 */
export class Bls12381Service extends Context.Tag('Bls12381Service')<
  Bls12381Service,
  Bls12381ServiceShape
>() {}
