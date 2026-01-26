/**
 * @fileoverview Keystore encryption for Effect.
 * @module Keystore/encrypt
 * @since 0.0.1
 */

import { Keystore } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import type { PrivateKeyType } from "./KeystoreService.js";

type EncryptionError = Error;
type EncryptOptions = Parameters<typeof Keystore.encrypt>[2];
type KeystoreV3 = Awaited<ReturnType<typeof Keystore.encrypt>>;

/**
 * Encrypts a private key with a password to create a keystore.
 *
 * @description
 * Creates an Ethereum-compatible keystore (Web3 Secret Storage) from a private key.
 * Uses scrypt or pbkdf2 for key derivation and AES-128-CTR for encryption.
 *
 * @param privateKey - The 32-byte private key to encrypt
 * @param password - Password for key derivation (should be strong)
 * @param options - Optional encryption parameters (kdf, iterations, etc.)
 * @returns Effect containing the KeystoreV3 JSON structure
 *
 * @example
 * ```typescript
 * import { encrypt, KeystoreLive } from 'voltaire-effect/crypto/Keystore'
 * import * as Effect from 'effect/Effect'
 *
 * const program = encrypt(privateKey, 'my-strong-password').pipe(
 *   Effect.provide(KeystoreLive)
 * )
 * // Returns KeystoreV3 JSON that can be saved to a file
 * ```
 *
 * @throws EncryptionError if encryption fails
 * @see {@link decrypt} to decrypt the keystore
 * @since 0.0.1
 */
export const encrypt = (
	privateKey: PrivateKeyType,
	password: string,
	options?: EncryptOptions,
): Effect.Effect<KeystoreV3, EncryptionError> =>
	Effect.tryPromise({
		try: () => Keystore.encrypt(privateKey, password, options),
		catch: (e) => e as EncryptionError,
	});
