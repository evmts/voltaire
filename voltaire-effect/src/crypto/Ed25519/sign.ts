import * as Effect from 'effect/Effect'
import * as Ed25519 from '@tevm/voltaire/Ed25519'
import type { InvalidSecretKeyError, Ed25519Error } from '@tevm/voltaire/Ed25519'

/**
 * Signs a message using the Ed25519 signature scheme.
 * Ed25519 provides high-speed, high-security signatures.
 *
 * @param message - The message bytes to sign
 * @param secretKey - The 32-byte secret key
 * @returns Effect containing the 64-byte Ed25519 signature
 * @example
 * ```typescript
 * import { sign } from 'voltaire-effect/crypto/Ed25519'
 * import * as Effect from 'effect/Effect'
 *
 * const signature = await Effect.runPromise(sign(message, secretKey))
 * ```
 * @since 0.0.1
 */
export const sign = (
  message: Uint8Array,
  secretKey: Uint8Array
): Effect.Effect<Uint8Array, InvalidSecretKeyError | Ed25519Error> =>
  Effect.try({
    try: () => Ed25519.sign(message, secretKey as any),
    catch: (e) => e as InvalidSecretKeyError | Ed25519Error
  })
