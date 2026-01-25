/**
 * @fileoverview Secp256k1 service definition for Effect-based applications.
 * Provides the service tag and shape interface for secp256k1 cryptographic operations.
 *
 * @module Secp256k1/Secp256k1Service
 * @since 0.0.1
 */

import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'
import type { HashType } from '@tevm/voltaire/Hash'
import type { Secp256k1SignatureType, Secp256k1PublicKeyType } from '@tevm/voltaire/Secp256k1'
import type { InvalidPrivateKeyError, InvalidSignatureError, CryptoError } from '@tevm/voltaire'

/**
 * Options for secp256k1 signing operations.
 *
 * @description
 * Configuration options for the sign operation, primarily for controlling
 * the RFC 6979 deterministic nonce generation.
 *
 * @example Using extra entropy
 * ```typescript
 * import { sign } from 'voltaire-effect/crypto/Secp256k1'
 *
 * const options: SignOptions = {
 *   extraEntropy: crypto.getRandomValues(new Uint8Array(32))
 * }
 * const signature = await Effect.runPromise(sign(hash, key, options))
 * ```
 *
 * @since 0.0.1
 */
export interface SignOptions {
  /**
   * Additional entropy for RFC 6979 nonce generation.
   *
   * @description
   * When set to a Uint8Array, it is mixed into the nonce generation for
   * additional randomness beyond the deterministic RFC 6979 algorithm.
   * When set to `true`, random entropy is automatically generated.
   * When undefined or `false`, standard RFC 6979 is used.
   */
  readonly extraEntropy?: Uint8Array | boolean
}

/**
 * Shape interface for secp256k1 cryptographic service operations.
 *
 * @description
 * Defines the contract for secp256k1 ECDSA implementations. This interface
 * specifies the three core operations: sign, recover, and verify.
 *
 * Used as the service shape for {@link Secp256k1Service}.
 *
 * @since 0.0.1
 */
export interface Secp256k1ServiceShape {
  /**
   * Signs a message hash using secp256k1 ECDSA.
   *
   * @param {HashType} messageHash - The 32-byte message hash to sign
   * @param {Uint8Array} privateKey - The 32-byte private key
   * @param {SignOptions} [options] - Optional signing options for extra entropy
   * @returns {Effect.Effect<Secp256k1SignatureType, InvalidPrivateKeyError | CryptoError>}
   *   Effect containing the 65-byte recoverable signature
   */
  readonly sign: (
    messageHash: HashType,
    privateKey: Uint8Array,
    options?: SignOptions
  ) => Effect.Effect<Secp256k1SignatureType, InvalidPrivateKeyError | CryptoError>

  /**
   * Recovers the public key from a signature and message hash.
   *
   * @param {Secp256k1SignatureType} signature - The 65-byte recoverable signature
   * @param {HashType} messageHash - The 32-byte message hash
   * @returns {Effect.Effect<Secp256k1PublicKeyType, InvalidSignatureError>}
   *   Effect containing the 65-byte uncompressed public key
   */
  readonly recover: (
    signature: Secp256k1SignatureType,
    messageHash: HashType
  ) => Effect.Effect<Secp256k1PublicKeyType, InvalidSignatureError>

  /**
   * Verifies a secp256k1 signature against a message hash and public key.
   *
   * @param {Secp256k1SignatureType} signature - The 65-byte signature
   * @param {HashType} messageHash - The 32-byte message hash
   * @param {Secp256k1PublicKeyType} publicKey - The 65-byte uncompressed public key
   * @returns {Effect.Effect<boolean, InvalidSignatureError>}
   *   Effect containing true if signature is valid
   */
  readonly verify: (
    signature: Secp256k1SignatureType,
    messageHash: HashType,
    publicKey: Secp256k1PublicKeyType
  ) => Effect.Effect<boolean, InvalidSignatureError>
}

/**
 * Secp256k1 cryptographic service for Effect-based applications.
 *
 * @description
 * An Effect Context.Tag that provides the standard Ethereum elliptic curve
 * (secp256k1) for transaction and message signing. The service pattern enables
 * swapping implementations for testing or alternative backends.
 *
 * The service exposes three operations:
 * - `sign` - Create a recoverable signature from a message hash and private key
 * - `recover` - Recover the public key from a signature and message hash
 * - `verify` - Verify a signature against a public key
 *
 * @example Basic usage with Effect.gen
 * ```typescript
 * import { Secp256k1Service, Secp256k1Live } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const secp = yield* Secp256k1Service
 *   const sig = yield* secp.sign(messageHash, privateKey)
 *   const pubKey = yield* secp.recover(sig, messageHash)
 *   return yield* secp.verify(sig, messageHash, pubKey)
 * }).pipe(Effect.provide(Secp256k1Live))
 *
 * const isValid = await Effect.runPromise(program) // true
 * ```
 *
 * @example Signing a transaction
 * ```typescript
 * import { Secp256k1Service, Secp256k1Live } from 'voltaire-effect/crypto/Secp256k1'
 * import { KeccakService, KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 * import * as Effect from 'effect/Effect'
 * import * as Layer from 'effect/Layer'
 *
 * const signTx = (txBytes: Uint8Array, privateKey: Uint8Array) =>
 *   Effect.gen(function* () {
 *     const keccak = yield* KeccakService
 *     const secp = yield* Secp256k1Service
 *     const txHash = yield* keccak.hash(txBytes)
 *     return yield* secp.sign(txHash, privateKey)
 *   })
 *
 * const CryptoLive = Layer.merge(KeccakLive, Secp256k1Live)
 * const signature = await Effect.runPromise(signTx(tx, key).pipe(Effect.provide(CryptoLive)))
 * ```
 *
 * @example Error handling
 * ```typescript
 * import { Secp256k1Service, Secp256k1Live } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const secp = yield* Secp256k1Service
 *   return yield* secp.sign(messageHash, privateKey)
 * }).pipe(
 *   Effect.catchTag('InvalidPrivateKeyError', (e) =>
 *     Effect.fail(new Error(`Invalid key: ${e.message}`))
 *   ),
 *   Effect.provide(Secp256k1Live)
 * )
 * ```
 *
 * @see {@link Secp256k1Live} - Production implementation
 * @see {@link Secp256k1Test} - Test implementation
 * @see {@link sign} - Standalone sign function
 * @see {@link recover} - Standalone recover function
 * @see {@link verify} - Standalone verify function
 * @since 0.0.1
 */
export class Secp256k1Service extends Context.Tag('Secp256k1Service')<
  Secp256k1Service,
  Secp256k1ServiceShape
>() {}
