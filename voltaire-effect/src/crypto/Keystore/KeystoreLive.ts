import * as Layer from 'effect/Layer'
import { KeystoreService } from './KeystoreService.js'
import { encrypt } from './encrypt.js'
import { decrypt } from './decrypt.js'

export const KeystoreLive = Layer.succeed(
  KeystoreService,
  {
    encrypt,
    decrypt
  }
)
