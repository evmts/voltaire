import { NONCE_SIZE } from "./constants.js";

/**
 * Generate a cryptographically secure random nonce for AES-GCM
 *
 * Uses `crypto.getRandomValues()` to generate 12 bytes (96 bits) of
 * cryptographically secure random data.
 *
 * **CRITICAL: Generate a fresh nonce for EVERY encryption operation.**
 * Reusing a nonce with the same key completely breaks AES-GCM security.
 * With 96-bit random nonces, birthday collision probability is negligible
 * for up to 2^32 encryptions per key (NIST recommendation).
 *
 * The nonce does not need to be secret - it can be stored alongside the
 * ciphertext. Only uniqueness matters.
 *
 * @see https://voltaire.tevm.sh/crypto/aesgcm/security for security best practices
 * @since 0.0.0
 * @returns {Uint8Array} 12-byte cryptographically secure random nonce
 * @throws {never}
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 *
 * // Generate fresh nonce for each encryption
 * const nonce1 = AesGcm.generateNonce();
 * const ct1 = await AesGcm.encrypt(msg1, key, nonce1);
 *
 * const nonce2 = AesGcm.generateNonce(); // New nonce!
 * const ct2 = await AesGcm.encrypt(msg2, key, nonce2);
 *
 * // Store nonce with ciphertext for later decryption
 * const stored = new Uint8Array(nonce1.length + ct1.length);
 * stored.set(nonce1, 0);
 * stored.set(ct1, nonce1.length);
 * ```
 */
export function generateNonce() {
	return crypto.getRandomValues(new Uint8Array(NONCE_SIZE));
}
