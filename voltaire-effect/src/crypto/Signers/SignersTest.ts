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

export const SignersTest = Layer.succeed(SignersService, testImpl)
