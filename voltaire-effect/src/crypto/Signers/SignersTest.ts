/**
 * @fileoverview Test implementation of SignersService.
 * @module Signers/SignersTest
 * @since 0.0.1
 */
import * as Layer from 'effect/Layer'
import * as Effect from 'effect/Effect'
import { SignersService, type SignersServiceShape, type Signer } from './SignersService.js'

const mockSigner: Signer = {
  address: '0x0000000000000000000000000000000000000000',
  publicKey: new Uint8Array(64),
  signMessage: (_message) => Effect.succeed('0x' + '00'.repeat(65)),
  signTransaction: (transaction) => Effect.succeed(transaction),
  signTypedData: (_typedData) => Effect.succeed('0x' + '00'.repeat(65))
}

const testImpl: SignersServiceShape = {
  fromPrivateKey: (_privateKey) => Effect.succeed(mockSigner),
  getAddress: (signer) => Effect.succeed(signer.address),
  recoverTransactionAddress: (_transaction) => Effect.succeed('0x0000000000000000000000000000000000000000')
}

/**
 * Test layer for SignersService returning deterministic mock values.
 *
 * @description
 * Provides mock implementations for unit testing. Returns a signer with
 * the zero address and mock signatures.
 * Use when testing application logic without cryptographic overhead.
 *
 * @example
 * ```typescript
 * import { SignersService, SignersTest, fromPrivateKey } from 'voltaire-effect/crypto/Signers'
 * import * as Effect from 'effect/Effect'
 *
 * const testProgram = fromPrivateKey('0x...').pipe(Effect.provide(SignersTest))
 * // Returns mock signer with zero address
 * ```
 *
 * @since 0.0.1
 */
export const SignersTest = Layer.succeed(SignersService, testImpl)
