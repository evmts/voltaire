import { chacha20poly1305 } from "@noble/ciphers/chacha.js";
import { KEY_SIZE, NONCE_SIZE } from "./constants.js";
import {
	ChaCha20Poly1305Error,
	InvalidKeyError,
	InvalidNonceError,
} from "./errors.js";

/**
 * Encrypt data with ChaCha20-Poly1305
 *
 * @see https://voltaire.tevm.sh/crypto/chacha20poly1305 for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} plaintext - Data to encrypt
 * @param {Uint8Array} key - 32-byte key (256 bits)
 * @param {Uint8Array} nonce - 12-byte nonce (96 bits)
 * @param {Uint8Array} [additionalData] - Optional additional authenticated data
 * @returns {Uint8Array} Ciphertext with authentication tag appended (16 bytes)
 * @throws {InvalidKeyError} If key is not 32 bytes
 * @throws {InvalidNonceError} If nonce is not 12 bytes
 * @throws {ChaCha20Poly1305Error} If encryption fails
 * @example
 * ```javascript
 * import * as ChaCha20Poly1305 from './crypto/ChaCha20Poly1305/index.js';
 * const plaintext = new TextEncoder().encode('Secret message');
 * const key = ChaCha20Poly1305.generateKey();
 * const nonce = ChaCha20Poly1305.generateNonce();
 * const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
 * ```
 */
export function encrypt(plaintext, key, nonce, additionalData) {
	if (key.length !== KEY_SIZE) {
		throw new InvalidKeyError(
			`Key must be ${KEY_SIZE} bytes, got ${key.length}`,
		);
	}

	if (nonce.length !== NONCE_SIZE) {
		throw new InvalidNonceError(
			`Nonce must be ${NONCE_SIZE} bytes, got ${nonce.length}`,
		);
	}

	try {
		const cipher = chacha20poly1305(key, nonce, additionalData);
		return cipher.encrypt(plaintext);
	} catch (error) {
		throw new ChaCha20Poly1305Error(`Encryption failed: ${error}`);
	}
}
