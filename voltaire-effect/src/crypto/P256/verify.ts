import * as Effect from 'effect/Effect'
import * as P256 from '@tevm/voltaire/P256'
import type { HashType } from '@tevm/voltaire/Hash'
import type { P256SignatureType } from '@tevm/voltaire/P256'
import type { InvalidPublicKeyError } from '@tevm/voltaire/P256'

/**
 * Verifies a P-256 signature against a message hash and public key.
 *
 * @param signature - The P-256 signature to verify
 * @param messageHash - The 32-byte message hash
 * @param publicKey - The 65-byte uncompressed public key
 * @returns Effect containing true if signature is valid, false otherwise
 * @example
 * ```typescript
 * import { verify } from 'voltaire-effect/crypto/P256'
 * import * as Effect from 'effect/Effect'
 *
 * const isValid = await Effect.runPromise(verify(signature, messageHash, publicKey))
 * ```
 * @since 0.0.1
 */
export const verify = (
  signature: P256SignatureType,
  messageHash: HashType | Uint8Array,
  publicKey: Uint8Array
): Effect.Effect<boolean, InvalidPublicKeyError> =>
  Effect.try({
    try: () => P256.verify(signature, messageHash as any, publicKey as any),
    catch: (e) => e as InvalidPublicKeyError
  })
