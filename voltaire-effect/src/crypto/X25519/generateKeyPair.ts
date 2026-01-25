/**
 * @fileoverview X25519 key pair generation for Effect.
 * @module X25519/generateKeyPair
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as X25519 from '@tevm/voltaire/X25519'

/**
 * Generates a random X25519 keypair.
 *
 * @description
 * Creates a cryptographically random X25519 key pair using secure random
 * number generation. The secret key is clamped per RFC 7748 specification.
 *
 * @returns Effect containing object with secretKey and publicKey (32 bytes each)
 *
 * @example
 * ```typescript
 * import { generateKeyPair } from 'voltaire-effect/crypto/X25519'
 * import * as Effect from 'effect/Effect'
 *
 * const keypair = await Effect.runPromise(generateKeyPair())
 * console.log(keypair.secretKey.length) // 32
 * console.log(keypair.publicKey.length) // 32
 * ```
 *
 * @throws Never fails
 * @see {@link getPublicKey} to derive public key from existing secret key
 * @see {@link computeSecret} to perform ECDH key agreement
 * @since 0.0.1
 */
export const generateKeyPair = (): Effect.Effect<
  { secretKey: Uint8Array; publicKey: Uint8Array },
  never
> =>
  Effect.sync(() => X25519.generateKeypair())
