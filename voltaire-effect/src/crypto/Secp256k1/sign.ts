/**
 * @fileoverview Secp256k1 signing function for Effect-based applications.
 * Provides a functional Effect wrapper around secp256k1 ECDSA signing.
 *
 * @module Secp256k1/sign
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import * as Secp256k1 from '@tevm/voltaire/Secp256k1'
import type { HashType } from '@tevm/voltaire/Hash'
import type { Secp256k1SignatureType } from '@tevm/voltaire/Secp256k1'
import type { InvalidPrivateKeyError, CryptoError } from '@tevm/voltaire'
import type { SignOptions } from './Secp256k1Service.js'

/**
 * Signs a message hash using the secp256k1 elliptic curve.
 *
 * @description
 * This is the standard Ethereum signing algorithm (ECDSA on secp256k1).
 * It produces a 65-byte recoverable signature containing:
 * - r (32 bytes): The x-coordinate of the ephemeral public key
 * - s (32 bytes): The signature proof
 * - v (1 byte): The recovery ID for public key recovery
 *
 * The function uses RFC 6979 deterministic nonce generation for security.
 * Optional extra entropy can be provided for additional randomness.
 *
 * @param {HashType} messageHash - The 32-byte message hash to sign (branded Uint8Array).
 *   Typically produced by Keccak256 hashing the message.
 * @param {Uint8Array} privateKey - The 32-byte secp256k1 private key.
 *   Must be a valid scalar in the curve's field.
 * @param {SignOptions} [options] - Optional signing options:
 *   - `extraEntropy`: Additional entropy for RFC 6979 nonce generation
 *
 * @returns {Effect.Effect<Secp256k1SignatureType, InvalidPrivateKeyError | CryptoError>}
 *   An Effect that:
 *   - Succeeds with a 65-byte Secp256k1SignatureType (branded Uint8Array)
 *   - Fails with InvalidPrivateKeyError if the private key is invalid
 *   - Fails with CryptoError for other cryptographic failures
 *
 * @throws {InvalidPrivateKeyError} When the private key is not a valid secp256k1 scalar
 * @throws {CryptoError} When signing fails for cryptographic reasons
 *
 * @example Basic signing
 * ```typescript
 * import { sign } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Effect from 'effect/Effect'
 *
 * const privateKey = new Uint8Array(32) // Your private key
 * const messageHash = keccak256(message)
 *
 * const signature = await Effect.runPromise(sign(messageHash, privateKey))
 * console.log(signature.length) // 65
 * ```
 *
 * @example With extra entropy
 * ```typescript
 * import { sign } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Effect from 'effect/Effect'
 *
 * const signature = await Effect.runPromise(
 *   sign(messageHash, privateKey, { extraEntropy: crypto.getRandomValues(new Uint8Array(32)) })
 * )
 * ```
 *
 * @example Error handling
 * ```typescript
 * import { sign } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Effect from 'effect/Effect'
 *
 * const program = sign(messageHash, privateKey).pipe(
 *   Effect.catchTag('InvalidPrivateKeyError', (e) =>
 *     Effect.fail(new Error(`Bad key: ${e.message}`))
 *   )
 * )
 * ```
 *
 * @see {@link recover} - Recover public key from signature
 * @see {@link verify} - Verify signature against public key
 * @see {@link Secp256k1Service} - Service interface for dependency injection
 * @since 0.0.1
 */
export const sign = (
  messageHash: HashType,
  privateKey: Uint8Array,
  options?: SignOptions
): Effect.Effect<Secp256k1SignatureType, InvalidPrivateKeyError | CryptoError> =>
  Effect.try({
    try: () => Secp256k1.sign(messageHash, privateKey as any, options),
    catch: (e) => e as InvalidPrivateKeyError | CryptoError
  })
