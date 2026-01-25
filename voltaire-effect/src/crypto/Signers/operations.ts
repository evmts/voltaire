import * as Effect from 'effect/Effect'
import * as Signers from '@tevm/voltaire/signers'
import type { InvalidPrivateKeyError, CryptoError } from '@tevm/voltaire'
import type { Signer } from './SignersService.js'

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

export const getAddress = (signer: Signer): Effect.Effect<string, never> =>
  Effect.succeed(signer.address)

export const recoverTransactionAddress = (
  transaction: unknown
): Effect.Effect<string, CryptoError> =>
  Effect.tryPromise({
    try: () => Signers.recoverTransactionAddress(transaction),
    catch: (e) => e as CryptoError
  })
