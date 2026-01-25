/**
 * @fileoverview AES-GCM authenticated encryption module for Effect.
 * Provides 128/256-bit AES encryption with Galois/Counter Mode for authenticated encryption.
 *
 * @module AesGcm
 * @since 0.0.1
 *
 * @description
 * AES-GCM (Advanced Encryption Standard - Galois/Counter Mode) provides both
 * confidentiality and authentication. Key features:
 *
 * - 128-bit or 256-bit keys
 * - 96-bit (12-byte) nonces (IVs)
 * - 128-bit authentication tag appended to ciphertext
 * - Optional additional authenticated data (AAD)
 *
 * @example
 * ```typescript
 * import { AesGcmService, AesGcmLive, encrypt, decrypt, generateKey, generateNonce } from 'voltaire-effect/crypto/AesGcm'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const key = yield* generateKey(256)
 *   const nonce = yield* generateNonce()
 *   const plaintext = new TextEncoder().encode('hello')
 *   const ciphertext = yield* encrypt(key, plaintext, nonce)
 *   const decrypted = yield* decrypt(key, ciphertext, nonce)
 *   return decrypted
 * }).pipe(Effect.provide(AesGcmLive))
 * ```
 *
 * @see {@link https://csrc.nist.gov/pubs/sp/800/38/d/final | NIST SP 800-38D}
 */
export { AesGcmService, type AesGcmServiceShape } from './AesGcmService.js'
export { encrypt, decrypt, generateKey, generateNonce } from './operations.js'
import * as Layer from 'effect/Layer'
import * as Effect from 'effect/Effect'
import { AesGcmService } from './AesGcmService.js'
import { encrypt, decrypt, generateKey, generateNonce } from './operations.js'

/**
 * Production layer for AesGcmService using Web Crypto API.
 *
 * @description
 * Provides real AES-GCM operations using the browser's native Web Crypto API.
 * Uses cryptographically secure random number generation for keys and nonces.
 *
 * @example
 * ```typescript
 * import { AesGcmService, AesGcmLive } from 'voltaire-effect/crypto/AesGcm'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const aes = yield* AesGcmService
 *   const key = yield* aes.generateKey(256)
 *   return key
 * }).pipe(Effect.provide(AesGcmLive))
 * ```
 *
 * @since 0.0.1
 * @see {@link AesGcmTest} for unit testing
 */
export const AesGcmLive = Layer.succeed(AesGcmService, {
  encrypt: (key, plaintext, nonce, aad) => encrypt(key, plaintext, nonce, aad),
  decrypt: (key, ciphertext, nonce, aad) => decrypt(key, ciphertext, nonce, aad),
  generateKey: (bits) => generateKey(bits ?? 256),
  generateNonce: () => generateNonce(),
})

/**
 * Test layer for AesGcmService returning deterministic mock values.
 *
 * @description
 * Provides mock implementations for unit testing. Returns zero-filled
 * arrays for encrypted data and keys.
 * Use when testing application logic without cryptographic overhead.
 *
 * @example
 * ```typescript
 * import { AesGcmService, AesGcmTest, encrypt } from 'voltaire-effect/crypto/AesGcm'
 * import * as Effect from 'effect/Effect'
 *
 * const testProgram = encrypt(key, plaintext, nonce).pipe(Effect.provide(AesGcmTest))
 * // Returns Uint8Array(32) filled with zeros
 * ```
 *
 * @since 0.0.1
 */
export const AesGcmTest = Layer.succeed(AesGcmService, {
  encrypt: () => Effect.succeed(new Uint8Array(32)),
  decrypt: () => Effect.succeed(new Uint8Array(16)),
  generateKey: () => Effect.succeed(new Uint8Array(32)),
  generateNonce: () => Effect.succeed(new Uint8Array(12)),
})
