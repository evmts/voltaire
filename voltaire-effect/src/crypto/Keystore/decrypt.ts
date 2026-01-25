import * as Effect from 'effect/Effect'
import * as Keystore from '@tevm/voltaire/Keystore'
import type { PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import type { KeystoreV3 } from '@tevm/voltaire/Keystore'
import type { DecryptError } from './KeystoreService.js'

export const decrypt = (
  keystore: KeystoreV3,
  password: string
): Effect.Effect<PrivateKeyType, DecryptError> =>
  Effect.try({
    try: () => Keystore.decrypt(keystore, password),
    catch: (e) => e as DecryptError
  })
