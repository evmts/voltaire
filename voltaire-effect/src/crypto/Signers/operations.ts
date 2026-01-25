/**
 * @fileoverview Signer operations for Effect.
 * @module Signers/operations
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as Signers from '@tevm/voltaire/signers'
import type { InvalidPrivateKeyError, CryptoError } from '@tevm/voltaire'
import type { Signer } from './SignersService.js'

/**
 * Creates a signer from a private key.
 *
 * @description
 * Constructs a Signer object that can sign messages, transactions, and typed data.
 * The signer derives the Ethereum address and public key from the private key.
 *
 * @param privateKey - The 32-byte private key as hex string or Uint8Array
 * @returns Effect containing a Signer object
 *
 * @example
 * ```typescript
 * import { fromPrivateKey, SignersLive } from 'voltaire-effect/crypto/Signers'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const signer = yield* fromPrivateKey('0x...')
 *   const sig = yield* signer.signMessage('Hello')
 *   return sig
 * }).pipe(Effect.provide(SignersLive))
 * ```
 *
 * @throws InvalidPrivateKeyError if the private key is invalid
 * @see {@link getAddress} to get the signer's address
 * @since 0.0.1
 */
export const fromPrivateKey = (
  privateKey: string | Uint8Array
): Effect.Effect<Signer, InvalidPrivateKeyError> =>
  Effect.try({
    try: () => {
      const impl = Signers.PrivateKeySignerImpl.fromPrivateKey({ privateKey })
      return {
        address: impl.address,
        publicKey: impl.publicKey,
        signMessage: (message: string | Uint8Array) =>
          Effect.tryPromise({
            try: () => impl.signMessage(message),
            catch: (e) => e as CryptoError
          }),
        signTransaction: (transaction: unknown) =>
          Effect.tryPromise({
            try: () => impl.signTransaction(transaction),
            catch: (e) => e as CryptoError
          }),
        signTypedData: (typedData: unknown) =>
          Effect.tryPromise({
            try: () => impl.signTypedData(typedData),
            catch: (e) => e as CryptoError
          })
      } as Signer
    },
    catch: (e) => e as InvalidPrivateKeyError
  })

/**
 * Gets the Ethereum address from a signer.
 *
 * @description
 * Returns the 20-byte Ethereum address derived from the signer's public key.
 * The address is checksummed per EIP-55.
 *
 * @param signer - The signer object
 * @returns Effect containing the Ethereum address as 0x-prefixed hex string
 *
 * @example
 * ```typescript
 * import { fromPrivateKey, getAddress, SignersLive } from 'voltaire-effect/crypto/Signers'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const signer = yield* fromPrivateKey('0x...')
 *   return yield* getAddress(signer)
 * }).pipe(Effect.provide(SignersLive))
 * ```
 *
 * @throws Never fails
 * @since 0.0.1
 */
export const getAddress = (signer: Signer): Effect.Effect<string, never> =>
  Effect.succeed(signer.address)

/**
 * Recovers the sender address from a signed transaction.
 *
 * @description
 * Uses ecrecover to extract the Ethereum address that signed a transaction.
 * This is how nodes verify transaction authenticity.
 *
 * @param transaction - The signed transaction object
 * @returns Effect containing the recovered Ethereum address
 *
 * @example
 * ```typescript
 * import { recoverTransactionAddress, SignersLive } from 'voltaire-effect/crypto/Signers'
 * import * as Effect from 'effect/Effect'
 *
 * const program = recoverTransactionAddress(signedTx).pipe(Effect.provide(SignersLive))
 * ```
 *
 * @throws CryptoError if signature recovery fails
 * @since 0.0.1
 */
export const recoverTransactionAddress = (
  transaction: unknown
): Effect.Effect<string, CryptoError> =>
  Effect.tryPromise({
    try: () => Signers.recoverTransactionAddress(transaction),
    catch: (e) => e as CryptoError
  })
