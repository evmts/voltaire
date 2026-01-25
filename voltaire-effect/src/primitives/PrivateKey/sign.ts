/**
 * @fileoverview Effect-based message signing with private key.
 * @module sign
 * @since 0.0.1
 */

import { _sign, type PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import type { HashType } from '@tevm/voltaire/Hash'
import * as Effect from 'effect/Effect'

/**
 * Signs a message hash with a private key.
 * 
 * @param privateKey - The private key to sign with
 * @param hash - The 32-byte message hash to sign
 * @returns Effect yielding the ECDSA signature
 * 
 * @example
 * ```typescript
 * const sig = Effect.runSync(PrivateKey.sign(pk, messageHash))
 * ```
 * 
 * @since 0.0.1
 */
export const sign = (privateKey: PrivateKeyType, hash: HashType): Effect.Effect<ReturnType<typeof _sign>, Error> =>
  Effect.try({
    try: () => _sign(privateKey, hash),
    catch: (e) => e as Error
  })
