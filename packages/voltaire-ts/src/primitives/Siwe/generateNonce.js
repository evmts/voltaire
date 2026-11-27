import { InvalidNonceLengthError } from "./errors.js";

const ALPHABET =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const ALPHABET_LEN = ALPHABET.length; // 62
// Largest multiple of 62 <= 256 to avoid modulo bias
const MAX_UNBIASED_BYTE = 248;

/**
 * Generate a cryptographically secure random nonce for SIWE messages
 *
 * @see https://voltaire.tevm.sh/primitives/siwe for SIWE documentation
 * @since 0.0.0
 * @param {number} [length=11] - Length of nonce (minimum 8)
 * @returns {string} Random alphanumeric nonce string
 * @throws {InvalidNonceLengthError} if length is less than 8
 * @example
 * ```javascript
 * import * as Siwe from './primitives/Siwe/index.js';
 * const nonce = Siwe.generateNonce();
 * // Returns something like "a7b9c2d4e6f"
 *
 * const longNonce = Siwe.generateNonce(16);
 * // Returns something like "a7b9c2d4e6f8g0h1"
 * ```
 */
export function generateNonce(length = 11) {
	if (length < 8) {
		throw new InvalidNonceLengthError(length);
	}

	let nonce = "";
	const buf = new Uint8Array(Math.max(length * 2, 16));

	while (nonce.length < length) {
		globalThis.crypto.getRandomValues(buf);
		for (let i = 0; i < buf.length && nonce.length < length; i++) {
			const byte = /** @type {number} */ (buf[i]);
			if (byte < MAX_UNBIASED_BYTE) {
				nonce += ALPHABET.charAt(byte % ALPHABET_LEN);
			}
		}
	}

	return nonce;
}
