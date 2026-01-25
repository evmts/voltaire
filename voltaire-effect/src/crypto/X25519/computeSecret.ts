import * as Effect from 'effect/Effect'
import * as X25519 from '@tevm/voltaire/X25519'
import type { InvalidSecretKeyError, InvalidPublicKeyError, X25519Error } from '@tevm/voltaire/X25519'

/**
 * Computes shared secret from your secret key and their public key (ECDH).
 *
 * @param secretKey - Your 32-byte secret key
 * @param publicKey - Their 32-byte public key
 * @returns Effect containing the 32-byte shared secret
 * @example
 * ```typescript
 * import { computeSecret } from 'voltaire-effect/crypto/X25519'
 * import * as Effect from 'effect/Effect'
 *
 * const shared = await Effect.runPromise(computeSecret(mySecretKey, theirPublicKey))
 * ```
 * @since 0.0.1
 */
export const computeSecret = (
  secretKey: Uint8Array,
  publicKey: Uint8Array
): Effect.Effect<Uint8Array, InvalidSecretKeyError | InvalidPublicKeyError | X25519Error> =>
  Effect.try({
    try: () => X25519.scalarmult(secretKey as any, publicKey as any),
    catch: (e) => e as InvalidSecretKeyError | InvalidPublicKeyError | X25519Error
  })
