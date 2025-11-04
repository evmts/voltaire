// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";

import {
	AES128_KEY_SIZE,
	AES256_KEY_SIZE,
	NONCE_SIZE,
	TAG_SIZE,
} from "./constants.js";
import { decrypt } from "./decrypt.js";
import { deriveKey } from "./deriveKey.js";
import { encrypt } from "./encrypt.js";
import { exportKey } from "./exportKey.js";
import { generateKey } from "./generateKey.js";
import { generateNonce } from "./generateNonce.js";
import { importKey } from "./importKey.js";

// Export individual functions
export {
	generateKey,
	importKey,
	exportKey,
	encrypt,
	decrypt,
	generateNonce,
	deriveKey,
};

/**
 * AES-GCM (Galois/Counter Mode) Authenticated Encryption
 *
 * Provides authenticated encryption using AES in GCM mode.
 * Uses native WebCrypto API for optimal performance and security.
 * Supports both AES-128-GCM and AES-256-GCM.
 *
 * @example
 * ```typescript
 * import { AesGcm } from './AesGcm.js';
 *
 * // Generate key
 * const key = await AesGcm.generateKey(256);
 *
 * // Encrypt data
 * const plaintext = new TextEncoder().encode('Hello, world!');
 * const nonce = AesGcm.generateNonce();
 * const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
 *
 * // Decrypt data
 * const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);
 * ```
 */
export const AesGcm = {
	generateKey,
	importKey,
	exportKey,
	encrypt,
	decrypt,
	generateNonce,
	deriveKey,
	AES128_KEY_SIZE,
	AES256_KEY_SIZE,
	NONCE_SIZE,
	TAG_SIZE,
};
