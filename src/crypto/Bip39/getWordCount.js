import { InvalidEntropyError } from "./errors.js";

/**
 * Get word count from entropy bits
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {number} entropyBits - Entropy in bits
 * @returns {number} Number of words in mnemonic
 * @throws {InvalidEntropyError} If entropy bits value is invalid
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * Bip39.getWordCount(128); // 12
 * Bip39.getWordCount(256); // 24
 * ```
 */
export function getWordCount(entropyBits) {
	if (entropyBits % 32 !== 0 || entropyBits < 128 || entropyBits > 256) {
		throw new InvalidEntropyError(
			"Entropy must be 128, 160, 192, 224, or 256 bits",
			{
				code: "BIP39_INVALID_ENTROPY_BITS",
				context: { bits: entropyBits, expected: "128, 160, 192, 224, or 256" },
				docsPath: "/crypto/bip39/get-word-count#error-handling",
			},
		);
	}
	return (entropyBits / 32) * 3;
}
