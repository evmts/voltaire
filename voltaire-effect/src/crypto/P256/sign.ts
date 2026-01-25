import * as Effect from 'effect/Effect'
import * as P256 from '@tevm/voltaire/P256'
import type { HashType } from '@tevm/voltaire/Hash'
import type { P256SignatureType } from '@tevm/voltaire/P256'
import type { InvalidPrivateKeyError, P256Error } from '@tevm/voltaire/P256'

/**
 * Signs a message hash using the P-256 (secp256r1) curve.
 * P-256 is widely used in WebAuthn, TLS, and secure hardware.
 *
 * @param messageHash - The 32-byte message hash to sign
 * @param privateKey - The 32-byte private key
 * @returns Effect containing the P-256 signature
 * @example
 * ```typescript
 * import { sign } from 'voltaire-effect/crypto/P256'
 * import * as Effect from 'effect/Effect'
 *
 * const signature = await Effect.runPromise(sign(messageHash, privateKey))
 * ```
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
