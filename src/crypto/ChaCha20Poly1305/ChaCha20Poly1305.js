// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";

import { KEY_SIZE, NONCE_SIZE, TAG_SIZE } from "./constants.js";
import { decrypt } from "./decrypt.js";
import { encrypt } from "./encrypt.js";
import { generateKey } from "./generateKey.js";
import { generateNonce } from "./generateNonce.js";

// Export individual functions
export { generateKey, encrypt, decrypt, generateNonce };

/**
 * ChaCha20-Poly1305 Authenticated Encryption (RFC 8439)
 *
 * Provides authenticated encryption using ChaCha20 stream cipher
 * with Poly1305 MAC. Optimized for software implementations.
 *
 * Uses @noble/ciphers for cryptographic operations.
 *
 * @example
 * ```typescript
 * import { ChaCha20Poly1305 } from './ChaCha20Poly1305.js';
 *
 * // Generate key
 * const key = ChaCha20Poly1305.generateKey();
 *
 * // Encrypt data
 * const plaintext = new TextEncoder().encode('Hello, world!');
 * const nonce = ChaCha20Poly1305.generateNonce();
 * const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
 *
 * // Decrypt data
 * const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);
 * ```
 */
export const ChaCha20Poly1305 = {
	generateKey,
	encrypt,
	decrypt,
	generateNonce,
	KEY_SIZE,
	NONCE_SIZE,
	TAG_SIZE,
};
