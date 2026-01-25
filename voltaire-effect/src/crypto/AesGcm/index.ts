export { AesGcmService, type AesGcmServiceShape } from './AesGcmService.js'
export { encrypt, decrypt, generateKey, generateNonce } from './operations.js'
import * as Layer from 'effect/Layer'
import * as Effect from 'effect/Effect'
import { AesGcmService } from './AesGcmService.js'
import { encrypt, decrypt, generateKey, generateNonce } from './operations.js'

export const AesGcmLive = Layer.succeed(AesGcmService, {
  encrypt: (key, plaintext, nonce, aad) => encrypt(key, plaintext, nonce, aad),
  decrypt: (key, ciphertext, nonce, aad) => decrypt(key, ciphertext, nonce, aad),
  generateKey: (bits) => generateKey(bits ?? 256),
  generateNonce: () => generateNonce(),
})

export const AesGcmTest = Layer.succeed(AesGcmService, {
  encrypt: () => Effect.succeed(new Uint8Array(32)),
  decrypt: () => Effect.succeed(new Uint8Array(16)),
  generateKey: () => Effect.succeed(new Uint8Array(32)),
  generateNonce: () => Effect.succeed(new Uint8Array(12)),
})
