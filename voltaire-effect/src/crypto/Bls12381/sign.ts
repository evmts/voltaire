import * as Effect from 'effect/Effect'
import * as Bls12381 from '@tevm/voltaire/Bls12381'
import type { InvalidScalarError, SignatureError } from '@tevm/voltaire/Bls12381'

/**
 * Signs a message using the BLS12-381 signature scheme.
 * BLS signatures support aggregation, making them ideal for consensus protocols.
 *
 * @param message - The message bytes to sign
 * @param privateKey - The 32-byte private key scalar
 * @returns Effect containing the 96-byte BLS signature
 * @example
 * ```typescript
 * import { sign } from 'voltaire-effect/crypto/Bls12381'
 * import * as Effect from 'effect/Effect'
 *
 * const signature = await Effect.runPromise(sign(message, privateKey))
 * ```
 * @since 0.0.1
 */
export const sign = (
  message: Uint8Array,
  privateKey: Uint8Array
): Effect.Effect<Uint8Array, InvalidScalarError | SignatureError> =>
  Effect.try({
    try: () => Bls12381.sign(message, privateKey),
    catch: (e) => e as InvalidScalarError | SignatureError
  })
