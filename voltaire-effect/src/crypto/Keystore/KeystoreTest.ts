import * as Layer from 'effect/Layer'
import * as Effect from 'effect/Effect'
import { KeystoreService, type KeystoreServiceShape } from './KeystoreService.js'
import type { PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import type { KeystoreV3 } from '@tevm/voltaire/Keystore'

const mockPrivateKey = new Uint8Array(32).fill(0x42) as unknown as PrivateKeyType

const mockKeystore: KeystoreV3 = {
  version: 3,
  id: 'test-uuid',
  crypto: {
    cipher: 'aes-128-ctr',
    ciphertext: '0'.repeat(64),
    cipherparams: { iv: '0'.repeat(32) },
    kdf: 'scrypt',
    kdfparams: {
      dklen: 32,
      n: 262144,
      r: 8,
      p: 1,
      salt: '0'.repeat(64)
    },
    mac: '0'.repeat(64)
  }
}

const testImpl: KeystoreServiceShape = {
  encrypt: (_privateKey, _password, _options) => Effect.succeed(mockKeystore),
  decrypt: (_keystore, _password) => Effect.succeed(mockPrivateKey)
}

export const KeystoreTest = Layer.succeed(KeystoreService, testImpl)
