/**
 * @fileoverview Keystore encryption for Effect.
 * @module Keystore/encrypt
 * @since 0.0.1
 */

import {
	InvalidPbkdf2IterationsError,
	InvalidScryptNError,
	Keystore,
	EncryptionError as KeystoreEncryptionError,
} from "@tevm/voltaire/Keystore";
import * as Effect from "effect/Effect";
import type { PrivateKeyType } from "./KeystoreService.js";

type EncryptionError =
	| KeystoreEncryptionError
	| InvalidScryptNError
	| InvalidPbkdf2IterationsError;
type EncryptOptions = Parameters<typeof Keystore.encrypt>[2];
type KeystoreV3 = Awaited<ReturnType<typeof Keystore.encrypt>>;

const toEncryptionError = (error: unknown): EncryptionError => {
	if (error instanceof KeystoreEncryptionError) return error;
	if (error instanceof InvalidScryptNError) return error;
	if (error instanceof InvalidPbkdf2IterationsError) return error;

	const message = error instanceof Error ? error.message : String(error);
	return new KeystoreEncryptionError(message, {
		cause: error instanceof Error ? error : undefined,
	});
};

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
 * @throws InvalidScryptNError if scrypt parameters are invalid
 * @throws InvalidPbkdf2IterationsError if PBKDF2 iterations are invalid
 * @see {@link decrypt} to decrypt the keystore
 * @since 0.0.1
 */
export const encrypt = (
	privateKey: PrivateKeyType,
	password: string,
	options?: EncryptOptions,
): Effect.Effect<KeystoreV3, EncryptionError> =>
	Effect.tryPromise({
		try: () => Keystore.encrypt(privateKey as never, password, options),
		catch: toEncryptionError,
	});
