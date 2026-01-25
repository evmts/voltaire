import * as Effect from 'effect/Effect'
import { ChaCha20Poly1305Service } from './ChaCha20Poly1305Service.js'

export const encrypt = (
  plaintext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  additionalData?: Uint8Array
): Effect.Effect<Uint8Array, never, ChaCha20Poly1305Service> =>
  Effect.gen(function* () {
    const service = yield* ChaCha20Poly1305Service
    return yield* service.encrypt(plaintext, key, nonce, additionalData)
  })

export const decrypt = (
  ciphertext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  additionalData?: Uint8Array
): Effect.Effect<Uint8Array, never, ChaCha20Poly1305Service> =>
  Effect.gen(function* () {
    const service = yield* ChaCha20Poly1305Service
    return yield* service.decrypt(ciphertext, key, nonce, additionalData)
  })

export const generateKey = (): Effect.Effect<Uint8Array, never, ChaCha20Poly1305Service> =>
  Effect.gen(function* () {
    const service = yield* ChaCha20Poly1305Service
    return yield* service.generateKey()
  })

export const generateNonce = (): Effect.Effect<Uint8Array, never, ChaCha20Poly1305Service> =>
  Effect.gen(function* () {
    const service = yield* ChaCha20Poly1305Service
    return yield* service.generateNonce()
  })
