/**
 * @fileoverview ChaCha20-Poly1305 authenticated encryption module for Effect.
 * Provides high-performance AEAD encryption with 256-bit keys.
 *
 * @module ChaCha20Poly1305
 * @since 0.0.1
 *
 * @description
 * ChaCha20-Poly1305 is an AEAD (Authenticated Encryption with Associated Data)
 * cipher combining the ChaCha20 stream cipher and Poly1305 MAC. Key features:
 *
 * - 256-bit keys (32 bytes)
 * - 96-bit (12-byte) nonces
 * - 128-bit authentication tag
 * - Constant-time implementation (resistant to timing attacks)
 * - No AES hardware required (good for mobile/embedded)
 *
 * @example
 * ```typescript
 * import { ChaCha20Poly1305Service, ChaCha20Poly1305Live, encrypt, decrypt, generateKey, generateNonce } from 'voltaire-effect/crypto/ChaCha20Poly1305'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const key = yield* generateKey()
 *   const nonce = yield* generateNonce()
 *   const plaintext = new TextEncoder().encode('hello')
 *   const ciphertext = yield* encrypt(plaintext, key, nonce)
 *   const decrypted = yield* decrypt(ciphertext, key, nonce)
 *   return decrypted
 * }).pipe(Effect.provide(ChaCha20Poly1305Live))
 * ```
 *
 * @see {@link https://datatracker.ietf.org/doc/html/rfc8439 | RFC 8439}
 */
export {
	ChaCha20Poly1305Live,
	ChaCha20Poly1305Service,
	type ChaCha20Poly1305ServiceShape,
	ChaCha20Poly1305Test,
} from "./ChaCha20Poly1305Service.js";
export { decrypt, encrypt, generateKey, generateNonce } from "./operations.js";
export {
	InvalidKeyError,
	InvalidNonceError,
	type ChaCha20Poly1305Error,
} from "./errors.js";
