import { ChaCha20Poly1305 } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

export interface ChaCha20Poly1305ServiceShape {
  readonly encrypt: (plaintext: Uint8Array, key: Uint8Array, nonce: Uint8Array, additionalData?: Uint8Array) => Effect.Effect<Uint8Array>
  readonly decrypt: (ciphertext: Uint8Array, key: Uint8Array, nonce: Uint8Array, additionalData?: Uint8Array) => Effect.Effect<Uint8Array>
  readonly generateKey: () => Effect.Effect<Uint8Array>
  readonly generateNonce: () => Effect.Effect<Uint8Array>
}

export class ChaCha20Poly1305Service extends Context.Tag("ChaCha20Poly1305Service")<
  ChaCha20Poly1305Service,
  ChaCha20Poly1305ServiceShape
>() {}

export const ChaCha20Poly1305Live = Layer.succeed(ChaCha20Poly1305Service, {
  encrypt: (plaintext, key, nonce, additionalData) => Effect.sync(() => ChaCha20Poly1305.encrypt(plaintext, key, nonce, additionalData)),
  decrypt: (ciphertext, key, nonce, additionalData) => Effect.sync(() => ChaCha20Poly1305.decrypt(ciphertext, key, nonce, additionalData)),
  generateKey: () => Effect.sync(() => ChaCha20Poly1305.generateKey()),
  generateNonce: () => Effect.sync(() => ChaCha20Poly1305.generateNonce())
})

export const ChaCha20Poly1305Test = Layer.succeed(ChaCha20Poly1305Service, {
  encrypt: (_plaintext, _key, _nonce, _additionalData) => Effect.sync(() => new Uint8Array(32)),
  decrypt: (_ciphertext, _key, _nonce, _additionalData) => Effect.sync(() => new Uint8Array(16)),
  generateKey: () => Effect.sync(() => new Uint8Array(32)),
  generateNonce: () => Effect.sync(() => new Uint8Array(12))
})
