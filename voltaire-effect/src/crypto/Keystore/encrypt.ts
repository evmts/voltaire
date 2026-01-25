import * as Effect from 'effect/Effect'
import * as Keystore from '@tevm/voltaire/Keystore'
import type { PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import type { KeystoreV3, EncryptOptions, EncryptionError } from '@tevm/voltaire/Keystore'

export const encrypt = (
  privateKey: PrivateKeyType,
  password: string,
  options?: EncryptOptions
): Effect.Effect<KeystoreV3, EncryptionError> =>
  Effect.tryPromise({
    try: () => Keystore.encrypt(privateKey, password, options),
    catch: (e) => e as EncryptionError
  })
