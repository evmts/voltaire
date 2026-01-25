/**
 * @fileoverview P-256 message signing function for Effect-based applications.
 * @module P256/sign
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import * as P256 from '@tevm/voltaire/P256'
import type { HashType } from '@tevm/voltaire/Hash'
import type { P256SignatureType } from '@tevm/voltaire/P256'
import type { InvalidPrivateKeyError, P256Error } from '@tevm/voltaire/P256'

/**
 * Signs a message hash using the P-256 (secp256r1) curve.
 *
 * @description
 * Creates an ECDSA signature on the P-256 (NIST secp256r1) curve. P-256 is
 * the standard elliptic curve with broad support across:
 *
 * - WebAuthn/FIDO2 passkeys
 * - TLS/SSL certificates
 * - Hardware Security Modules (HSMs)
 * - Smart cards and secure enclaves
 *
 * The message should already be hashed (typically with SHA-256) before signing.
 * Unlike secp256k1 used in Bitcoin/Ethereum, P-256 is the NIST-recommended curve.
 *
 * @param messageHash - The 32-byte message hash to sign (pre-hashed with SHA-256)
 * @param privateKey - The 32-byte private key
 * @returns Effect containing the P-256 signature with r, s, v components
 *
 * @example
 * ```typescript
 * import { sign, verify } from 'voltaire-effect/crypto/P256'
 * import { hash } from 'voltaire-effect/crypto/SHA256'
 * import * as Effect from 'effect/Effect'
 *
 * // Sign a message hash
 * const messageHash = await Effect.runPromise(hash(message))
 * const signature = await Effect.runPromise(sign(messageHash, privateKey))
 *
 * // Complete workflow
 * const program = Effect.gen(function* () {
 *   const msgHash = yield* hash(message)
 *   const sig = yield* sign(msgHash, privateKey)
 *   return sig
 * })
 * ```
 *
 * @throws InvalidPrivateKeyError - When the private key is invalid or wrong size
 * @throws P256Error - When the signing operation fails
 * @see {@link verify} - Verify the generated signature
 * @see {@link P256Service} - Full service interface
 * @since 0.0.1
 */
export const sign = (
  messageHash: HashType | Uint8Array,
  privateKey: Uint8Array
): Effect.Effect<P256SignatureType, InvalidPrivateKeyError | P256Error> =>
  Effect.try({
    try: () => P256.sign(messageHash as any, privateKey as any),
    catch: (e) => e as InvalidPrivateKeyError | P256Error
  })
