import * as Layer from 'effect/Layer'
import { SignersService } from './SignersService.js'
import { fromPrivateKey, getAddress, recoverTransactionAddress } from './operations.js'

export const SignersLive = Layer.succeed(
  SignersService,
  {
    fromPrivateKey,
    getAddress,
    recoverTransactionAddress
  }
)
