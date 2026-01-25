import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'

export interface AesGcmServiceShape {
  readonly encrypt: (key: Uint8Array, plaintext: Uint8Array, nonce: Uint8Array, aad?: Uint8Array) => Effect.Effect<Uint8Array, Error>
  readonly decrypt: (key: Uint8Array, ciphertext: Uint8Array, nonce: Uint8Array, aad?: Uint8Array) => Effect.Effect<Uint8Array, Error>
  readonly generateKey: (bits?: 128 | 256) => Effect.Effect<Uint8Array, Error>
  readonly generateNonce: () => Effect.Effect<Uint8Array, Error>
}

export class AesGcmService extends Context.Tag("AesGcmService")<
  AesGcmService,
  AesGcmServiceShape
>() {}
