import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'
import type { PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import type { KeystoreV3, EncryptOptions } from '@tevm/voltaire/Keystore'
import type {
  EncryptionError,
  DecryptionError,
  InvalidMacError,
  UnsupportedVersionError,
  UnsupportedKdfError
} from '@tevm/voltaire/Keystore'

export type DecryptError = DecryptionError | InvalidMacError | UnsupportedVersionError | UnsupportedKdfError

export interface KeystoreServiceShape {
  readonly encrypt: (
    privateKey: PrivateKeyType,
    password: string,
    options?: EncryptOptions
  ) => Effect.Effect<KeystoreV3, EncryptionError>

  readonly decrypt: (
    keystore: KeystoreV3,
    password: string
  ) => Effect.Effect<PrivateKeyType, DecryptError>
}

export class KeystoreService extends Context.Tag('KeystoreService')<
  KeystoreService,
  KeystoreServiceShape
>() {}
