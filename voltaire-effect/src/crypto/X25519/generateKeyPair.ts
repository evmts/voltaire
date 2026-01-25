import * as Effect from 'effect/Effect'
import * as X25519 from '@tevm/voltaire/X25519'

/**
 * Generates a random X25519 keypair.
 *
 * @returns Effect containing object with secretKey and publicKey (32 bytes each)
 * @example
 * ```typescript
 * import { generateKeyPair } from 'voltaire-effect/crypto/X25519'
 * import * as Effect from 'effect/Effect'
 *
 * const keypair = await Effect.runPromise(generateKeyPair())
 * console.log(keypair.secretKey.length) // 32
 * console.log(keypair.publicKey.length) // 32
 * ```
 * @since 0.0.1
 */
export const generateKeyPair = (): Effect.Effect<
  { secretKey: Uint8Array; publicKey: Uint8Array },
  never
> =>
  Effect.sync(() => X25519.generateKeypair())
