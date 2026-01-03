import { NONCE_SIZE } from "./constants.js";

/**
 * Generate cryptographically random 12-byte nonce for AES-GCM
 *
 * **SECURITY: Always use this function or equivalent CSPRNG for nonces.**
 * AES-GCM security depends on nonce uniqueness per (key, message) pair.
 * Nonce reuse completely breaks confidentiality (allows XOR attack on
 * ciphertexts) and authenticity (allows tag forgery). With 96-bit random
 * nonces, collision probability stays negligible under 2^32 encryptions
 * per key. For higher volumes, use deterministic nonce schemes (e.g.,
 * counter-based) or rotate keys.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @returns {Uint8Array} 12-byte cryptographically random nonce
 * @throws {never}
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 * // Generate fresh nonce for each encryption
 * const nonce = AesGcm.generateNonce();
 * const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
 * // Store nonce alongside ciphertext for decryption
 * ```
 */
export function generateNonce() {
	return crypto.getRandomValues(new Uint8Array(NONCE_SIZE));
}
