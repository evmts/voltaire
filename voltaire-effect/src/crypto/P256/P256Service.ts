import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'
import type { HashType } from '@tevm/voltaire/Hash'
import type { P256SignatureType } from '@tevm/voltaire/P256'
import type { InvalidPrivateKeyError, InvalidPublicKeyError, P256Error } from '@tevm/voltaire/P256'

/**
 * Shape interface for P-256 (secp256r1) cryptographic service operations.
 * @since 0.0.1
 */
export interface P256ServiceShape {
  /**
   * Signs a message hash using P-256 (NIST curve).
   * @param messageHash - The 32-byte message hash
   * @param privateKey - The 32-byte private key
   * @returns Effect containing the P-256 signature
   */
  readonly sign: (
    messageHash: HashType | Uint8Array,
    privateKey: Uint8Array
  ) => Effect.Effect<P256SignatureType, InvalidPrivateKeyError | P256Error>

  /**
   * Verifies a P-256 signature against a message hash and public key.
   * @param signature - The P-256 signature
   * @param messageHash - The 32-byte message hash
   * @param publicKey - The 65-byte uncompressed public key
   * @returns Effect containing true if signature is valid
   */
  readonly verify: (
    signature: P256SignatureType,
    messageHash: HashType | Uint8Array,
    publicKey: Uint8Array
  ) => Effect.Effect<boolean, InvalidPublicKeyError>
}

/**
 * P-256 (secp256r1/NIST P-256) cryptographic service for Effect-based applications.
 * Used in WebAuthn, TLS, and hardware security modules.
 *
 * @example
 * ```typescript
 * import { P256Service, P256Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const p256 = yield* P256Service
 *   const sig = yield* p256.sign(messageHash, privateKey)
 *   return yield* p256.verify(sig, messageHash, publicKey)
 * }).pipe(Effect.provide(P256Live))
 * ```
 * @since 0.0.1
 */
export class P256Service extends Context.Tag('P256Service')<
  P256Service,
  P256ServiceShape
>() {}
