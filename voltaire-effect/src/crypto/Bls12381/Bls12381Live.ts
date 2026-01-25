/**
 * @fileoverview Production layer for Bls12381Service using native implementation.
 * @module Bls12381Live
 * @since 0.0.1
 */

import * as Layer from 'effect/Layer'
import { Bls12381Service } from './Bls12381Service.js'
import { sign } from './sign.js'
import { verify } from './verify.js'
import { aggregate } from './aggregate.js'

/**
 * Production layer for Bls12381Service using native BLS12-381 implementation.
 *
 * @description
 * Provides the live implementation backed by the high-performance native
 * BLS12-381 implementation from @tevm/voltaire. Use this layer in production
 * applications for real cryptographic operations.
 *
 * @example
 * ```typescript
 * import { Bls12381Service, Bls12381Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * // Sign and verify with BLS12-381
 * const program = Effect.gen(function* () {
 *   const bls = yield* Bls12381Service
 *   const sig = yield* bls.sign(message, privateKey)
 *   return yield* bls.verify(sig, message, publicKey)
 * }).pipe(Effect.provide(Bls12381Live))
 *
 * const isValid = await Effect.runPromise(program)
 * ```
 *
 * @see {@link Bls12381Service} - The service definition
 * @since 0.0.1
 */
export const Bls12381Live = Layer.succeed(
  Bls12381Service,
  {
    sign,
    verify,
    aggregate
  }
)
