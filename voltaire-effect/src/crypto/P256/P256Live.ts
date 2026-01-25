/**
 * @fileoverview Production layer for P256Service using native implementation.
 * @module P256Live
 * @since 0.0.1
 */

import * as Layer from 'effect/Layer'
import { P256Service } from './P256Service.js'
import { sign } from './sign.js'
import { verify } from './verify.js'

/**
 * Production layer for P256Service using native P-256 implementation.
 *
 * @description
 * Provides the live implementation backed by the high-performance native
 * P-256 (secp256r1) implementation from @tevm/voltaire. Use this layer in
 * production applications for real cryptographic operations.
 *
 * @example
 * ```typescript
 * import { P256Service, P256Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * // Sign and verify with P-256
 * const program = Effect.gen(function* () {
 *   const p256 = yield* P256Service
 *   const sig = yield* p256.sign(messageHash, privateKey)
 *   return yield* p256.verify(sig, messageHash, publicKey)
 * }).pipe(Effect.provide(P256Live))
 *
 * const isValid = await Effect.runPromise(program)
 * ```
 *
 * @see {@link P256Service} - The service definition
 * @since 0.0.1
 */
export const P256Live = Layer.succeed(
  P256Service,
  {
    sign,
    verify
  }
)
