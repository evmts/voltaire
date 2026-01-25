/**
 * @fileoverview Production implementation of SignersService.
 * @module Signers/SignersLive
 * @since 0.0.1
 */
import * as Layer from 'effect/Layer'
import { SignersService } from './SignersService.js'
import { fromPrivateKey, getAddress, recoverTransactionAddress } from './operations.js'

/**
 * Production layer for SignersService using native implementation.
 *
 * @description
 * Provides real signing operations using secp256k1 for signatures.
 * Supports EIP-191 personal sign, transaction signing, and EIP-712 typed data.
 *
 * @example
 * ```typescript
 * import { SignersService, SignersLive } from 'voltaire-effect/crypto/Signers'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const signers = yield* SignersService
 *   const signer = yield* signers.fromPrivateKey(privateKey)
 *   return yield* signers.getAddress(signer)
 * }).pipe(Effect.provide(SignersLive))
 * ```
 *
 * @since 0.0.1
 * @see {@link SignersTest} for unit testing
 */
export const SignersLive = Layer.succeed(
  SignersService,
  {
    fromPrivateKey,
    getAddress,
    recoverTransactionAddress
  }
)
