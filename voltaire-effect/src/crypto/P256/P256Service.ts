/**
 * @fileoverview P-256 (secp256r1/NIST P-256) cryptographic signature service for Effect-based applications.
 * Provides ECDSA signatures on the NIST P-256 curve for WebAuthn, TLS, and HSM compatibility.
 * @module P256Service
 * @since 0.0.1
 */

import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'
import type { HashType } from '@tevm/voltaire/Hash'
import type { P256SignatureType } from '@tevm/voltaire/P256'
import type { InvalidPrivateKeyError, InvalidPublicKeyError, P256Error } from '@tevm/voltaire/P256'

/**
 * Shape interface for P-256 (secp256r1) cryptographic service operations.
 *
 * @description
 * Defines the contract for P-256 ECDSA signature operations including signing
 * and verification. P-256 is the NIST standard curve widely supported by
 * hardware security modules and browser APIs.
 *
 * @see {@link P256Service} - The service using this shape
 * @since 0.0.1
 */
export interface P256ServiceShape {
  /**
   * Signs a message hash using P-256 (NIST curve) ECDSA.
   *
   * @description
   * Creates an ECDSA signature on the secp256r1 curve. The message should
   * already be hashed (typically with SHA-256) before signing.
   *
   * @param messageHash - The 32-byte message hash to sign
   * @param privateKey - The 32-byte private key
   * @returns Effect containing the P-256 signature (r, s, v components)
   * @throws InvalidPrivateKeyError - When the private key is invalid
   * @throws P256Error - When signing fails
   */
  readonly sign: (
    messageHash: HashType | Uint8Array,
    privateKey: Uint8Array
  ) => Effect.Effect<P256SignatureType, InvalidPrivateKeyError | P256Error>

  /**
   * Verifies a P-256 ECDSA signature against a message hash and public key.
   *
   * @description
   * Validates that a signature was created by the holder of the private key
   * corresponding to the given public key.
   *
   * @param signature - The P-256 signature to verify
   * @param messageHash - The 32-byte message hash
   * @param publicKey - The 65-byte uncompressed or 33-byte compressed public key
   * @returns Effect containing true if signature is valid, false otherwise
   * @throws InvalidPublicKeyError - When the public key is invalid
   */
  readonly verify: (
    signature: P256SignatureType,
    messageHash: HashType | Uint8Array,
    publicKey: Uint8Array
  ) => Effect.Effect<boolean, InvalidPublicKeyError>
}

/**
 * P-256 (secp256r1/NIST P-256) cryptographic service for Effect-based applications.
 *
 * @description
 * P-256 is the NIST standard elliptic curve (also known as secp256r1 or prime256v1).
 * It provides widely-supported ECDSA signatures compatible with:
 *
 * - WebAuthn/FIDO2 passkeys
 * - TLS/SSL certificates
 * - Hardware Security Modules (HSMs)
 * - Smart cards and secure enclaves
 * - EIP-7212 on Ethereum (secp256r1 precompile)
 *
 * Key features:
 * - 32-byte keys, ~64-byte signatures
 * - NIST standard with broad hardware support
 * - Required for WebAuthn/passkey authentication
 *
 * @example
 * ```typescript
 * import { P256Service, P256Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * // Complete sign and verify workflow
 * const program = Effect.gen(function* () {
 *   const p256 = yield* P256Service
 *
 *   // Sign a message hash
 *   const sig = yield* p256.sign(messageHash, privateKey)
 *
 *   // Verify the signature
 *   const isValid = yield* p256.verify(sig, messageHash, publicKey)
 *   return { sig, isValid }
 * }).pipe(Effect.provide(P256Live))
 *
 * const result = await Effect.runPromise(program)
 * console.log(result.isValid) // true
 * ```
 *
 * @see {@link P256Live} - Production layer using native P-256
 * @see {@link sign} - Standalone sign function
 * @see {@link verify} - Standalone verify function
 * @since 0.0.1
 */
export class P256Service extends Context.Tag('P256Service')<
  P256Service,
  P256ServiceShape
>() {}
