/**
 * @fileoverview Production layer for Ed25519Service using native implementation.
 * @module Ed25519Live
 * @since 0.0.1
 */

import * as Layer from 'effect/Layer'
import { Ed25519Service } from './Ed25519Service.js'
import { sign } from './sign.js'
import { verify } from './verify.js'
import { getPublicKey } from './getPublicKey.js'

/**
 * Production layer for Ed25519Service using native Ed25519 implementation.
 *
 * @description
 * Provides the live implementation backed by the high-performance native
 * Ed25519 implementation from @tevm/voltaire. Use this layer in production
 * applications for real cryptographic operations.
 *
 * @example
 * ```typescript
 * import { Ed25519Service, Ed25519Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * // Sign and verify a message
 * const program = Effect.gen(function* () {
 *   const ed = yield* Ed25519Service
 *   const sig = yield* ed.sign(message, secretKey)
 *   return yield* ed.verify(sig, message, publicKey)
 * }).pipe(Effect.provide(Ed25519Live))
 *
 * const isValid = await Effect.runPromise(program)
 * ```
 *
 * @see {@link Ed25519Service} - The service definition
 * @see {@link Ed25519Test} - Test layer for unit testing
 * @since 0.0.1
 */
export const Ed25519Live = Layer.succeed(
  Ed25519Service,
  {
    sign,
    verify,
    getPublicKey
  }
)
