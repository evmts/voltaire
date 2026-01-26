/**
 * @fileoverview ChaCha20Poly1305Service Effect service definition for AEAD encryption.
 * @module ChaCha20Poly1305/ChaCha20Poly1305Service
 * @since 0.0.1
 */
import { ChaCha20Poly1305 } from "@tevm/voltaire";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { InvalidKeyError, InvalidNonceError } from "./errors.js";

const KEY_LENGTH = 32;
const NONCE_LENGTH = 12;

const validateKey = (key: Uint8Array) =>
	key.length === KEY_LENGTH
		? Effect.void
		: Effect.fail(
				new InvalidKeyError({
					message: `Key must be ${KEY_LENGTH} bytes, got ${key.length}`,
					keyLength: key.length,
					expectedLength: KEY_LENGTH,
				}),
			);

const validateNonce = (nonce: Uint8Array) =>
	nonce.length === NONCE_LENGTH
		? Effect.void
		: Effect.fail(
				new InvalidNonceError({
					message: `Nonce must be ${NONCE_LENGTH} bytes, got ${nonce.length}`,
					nonceLength: nonce.length,
					expectedLength: NONCE_LENGTH,
				}),
			);

/**
 * Shape interface for ChaCha20-Poly1305 encryption service operations.
 *
 * @description
 * Defines the contract for ChaCha20-Poly1305 implementations. All methods return
 * Effect types for composable, type-safe async/error handling.
 *
 * @since 0.0.1
 */
export interface ChaCha20Poly1305ServiceShape {
	/**
	 * Encrypts plaintext using ChaCha20-Poly1305.
	 * @param plaintext - Data to encrypt
	 * @param key - 32-byte (256-bit) key
	 * @param nonce - 12-byte (96-bit) nonce (must be unique per key)
	 * @param additionalData - Optional additional authenticated data
	 * @returns Effect containing ciphertext with appended 16-byte auth tag
	 */
	readonly encrypt: (
		plaintext: Uint8Array,
		key: Uint8Array,
		nonce: Uint8Array,
		additionalData?: Uint8Array,
	) => Effect.Effect<Uint8Array>;
	/**
	 * Decrypts ciphertext using ChaCha20-Poly1305.
	 * @param ciphertext - Encrypted data with appended auth tag
	 * @param key - Same 32-byte key used for encryption
	 * @param nonce - Same 12-byte nonce used for encryption
	 * @param additionalData - Same AAD used for encryption (if any)
	 * @returns Effect containing decrypted plaintext
	 */
	readonly decrypt: (
		ciphertext: Uint8Array,
		key: Uint8Array,
		nonce: Uint8Array,
		additionalData?: Uint8Array,
	) => Effect.Effect<Uint8Array>;
	/**
	 * Generates a cryptographically random 256-bit key.
	 * @returns Effect containing 32-byte random key
	 */
	readonly generateKey: () => Effect.Effect<Uint8Array>;
	/**
	 * Generates a cryptographically random 96-bit nonce.
	 * @returns Effect containing 12-byte random nonce
	 */
	readonly generateNonce: () => Effect.Effect<Uint8Array>;
}

/**
 * ChaCha20-Poly1305 AEAD service for Effect-based applications.
 *
 * @description
 * Provides authenticated encryption using ChaCha20 stream cipher with Poly1305 MAC.
 * Offers excellent performance on systems without AES hardware acceleration.
 *
 * @example
 * ```typescript
 * import { ChaCha20Poly1305Service, ChaCha20Poly1305Live } from 'voltaire-effect/crypto/ChaCha20Poly1305'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const chacha = yield* ChaCha20Poly1305Service
 *   const key = yield* chacha.generateKey()
 *   const nonce = yield* chacha.generateNonce()
 *   return yield* chacha.encrypt(plaintext, key, nonce)
 * }).pipe(Effect.provide(ChaCha20Poly1305Live))
 * ```
 *
 * @since 0.0.1
 */
export class ChaCha20Poly1305Service extends Context.Tag(
	"ChaCha20Poly1305Service",
)<ChaCha20Poly1305Service, ChaCha20Poly1305ServiceShape>() {}

/**
 * Production layer for ChaCha20Poly1305Service using native implementation.
 *
 * @description
 * Provides real ChaCha20-Poly1305 operations with constant-time implementation.
 * Uses cryptographically secure random number generation for keys and nonces.
 *
 * @example
 * ```typescript
 * import { ChaCha20Poly1305Service, ChaCha20Poly1305Live } from 'voltaire-effect/crypto/ChaCha20Poly1305'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const chacha = yield* ChaCha20Poly1305Service
 *   return yield* chacha.generateKey()
 * }).pipe(Effect.provide(ChaCha20Poly1305Live))
 * ```
 *
 * @since 0.0.1
 * @see {@link ChaCha20Poly1305Test} for unit testing
 */
export const ChaCha20Poly1305Live = Layer.succeed(ChaCha20Poly1305Service, {
	encrypt: (plaintext, key, nonce, additionalData) =>
		Effect.gen(function* () {
			yield* validateKey(key);
			yield* validateNonce(nonce);
			return ChaCha20Poly1305.encrypt(plaintext, key, nonce, additionalData);
		}),
	decrypt: (ciphertext, key, nonce, additionalData) =>
		Effect.gen(function* () {
			yield* validateKey(key);
			yield* validateNonce(nonce);
			return ChaCha20Poly1305.decrypt(ciphertext, key, nonce, additionalData);
		}),
	generateKey: () => Effect.sync(() => ChaCha20Poly1305.generateKey()),
	generateNonce: () => Effect.sync(() => ChaCha20Poly1305.generateNonce()),
});

/**
 * Test layer for ChaCha20Poly1305Service returning deterministic mock values.
 *
 * @description
 * Provides mock implementations for unit testing. Returns zero-filled
 * arrays for encrypted data and keys.
 * Use when testing application logic without cryptographic overhead.
 *
 * @example
 * ```typescript
 * import { ChaCha20Poly1305Service, ChaCha20Poly1305Test, encrypt } from 'voltaire-effect/crypto/ChaCha20Poly1305'
 * import * as Effect from 'effect/Effect'
 *
 * const testProgram = encrypt(plaintext, key, nonce).pipe(Effect.provide(ChaCha20Poly1305Test))
 * // Returns Uint8Array(32) filled with zeros
 * ```
 *
 * @since 0.0.1
 */
export const ChaCha20Poly1305Test = Layer.succeed(ChaCha20Poly1305Service, {
	encrypt: (_plaintext, _key, _nonce, _additionalData) =>
		Effect.sync(() => new Uint8Array(32)),
	decrypt: (_ciphertext, _key, _nonce, _additionalData) =>
		Effect.sync(() => new Uint8Array(16)),
	generateKey: () => Effect.sync(() => new Uint8Array(32)),
	generateNonce: () => Effect.sync(() => new Uint8Array(12)),
});
