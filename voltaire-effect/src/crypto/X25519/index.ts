/**
 * @fileoverview X25519 key exchange module for Effect.
 * Provides Curve25519 ECDH for secure shared secret generation.
 *
 * @module X25519
 * @since 0.0.1
 *
 * @description
 * X25519 is an elliptic curve Diffie-Hellman (ECDH) key agreement protocol
 * using Curve25519. It enables two parties to establish a shared secret
 * over an insecure channel. Key features:
 *
 * - 32-byte (256-bit) keys
 * - Constant-time implementation (resistant to timing attacks)
 * - High security with compact keys
 * - Widely used in TLS 1.3, Signal Protocol, WireGuard
 *
 * @example
 * ```typescript
 * import { X25519Service, X25519Live, generateKeyPair, computeSecret } from 'voltaire-effect/crypto/X25519'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const alice = yield* generateKeyPair()
 *   const bob = yield* generateKeyPair()
 *   const sharedAlice = yield* computeSecret(alice.secretKey, bob.publicKey)
 *   const sharedBob = yield* computeSecret(bob.secretKey, alice.publicKey)
 *   // sharedAlice equals sharedBob
 *   return sharedAlice
 * }).pipe(Effect.provide(X25519Live))
 * ```
 *
 * @see {@link https://datatracker.ietf.org/doc/html/rfc7748 | RFC 7748}
 */
export { generateKeyPair } from './generateKeyPair.js'
export { getPublicKey } from './getPublicKey.js'
export { computeSecret } from './computeSecret.js'
export { X25519Service, type X25519ServiceShape } from './X25519Service.js'
export { X25519Live } from './X25519Live.js'
export { X25519Test } from './X25519Test.js'
