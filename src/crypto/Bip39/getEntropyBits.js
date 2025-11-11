import { Bip39Error } from "./errors.js";

/**
 * Get entropy bits from word count
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {number} wordCount - Number of words
 * @returns {number} Entropy in bits
 * @throws {Bip39Error} If word count is invalid
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * Bip39.getEntropyBits(12); // 128
 * Bip39.getEntropyBits(24); // 256
 * ```
 */
export function getEntropyBits(wordCount) {
	if (![12, 15, 18, 21, 24].includes(wordCount)) {
		throw new Bip39Error("Word count must be 12, 15, 18, 21, or 24", {
			code: "BIP39_INVALID_WORD_COUNT",
			context: { wordCount, expected: "12, 15, 18, 21, or 24" },
			docsPath: "/crypto/bip39/get-entropy-bits#error-handling",
		});
	}
	return (wordCount / 3) * 32;
}
