import * as Effect from 'effect/Effect'
import { AesGcm } from '@tevm/voltaire'

export const encrypt = (key: Uint8Array, plaintext: Uint8Array, nonce: Uint8Array, aad?: Uint8Array): Effect.Effect<Uint8Array, Error> =>
  Effect.tryPromise({
    try: async () => {
      const cryptoKey = await AesGcm.importKey(key)
      return AesGcm.encrypt(plaintext, cryptoKey, nonce, aad)
    },
    catch: (e) => e as Error
  })

export const decrypt = (key: Uint8Array, ciphertext: Uint8Array, nonce: Uint8Array, aad?: Uint8Array): Effect.Effect<Uint8Array, Error> =>
  Effect.tryPromise({
    try: async () => {
      const cryptoKey = await AesGcm.importKey(key)
      return AesGcm.decrypt(ciphertext, cryptoKey, nonce, aad)
    },
    catch: (e) => e as Error
  })

export const generateKey = (bits: 128 | 256 = 256): Effect.Effect<Uint8Array, Error> =>
  Effect.tryPromise({
    try: async () => {
      const cryptoKey = await AesGcm.generateKey(bits)
      return AesGcm.exportKey(cryptoKey)
    },
    catch: (e) => e as Error
  })

export const generateNonce = (): Effect.Effect<Uint8Array, Error> =>
  Effect.try({
    try: () => AesGcm.generateNonce(),
    catch: (e) => e as Error
  })
