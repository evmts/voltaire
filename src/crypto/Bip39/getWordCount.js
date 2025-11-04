import { InvalidEntropyError } from "./errors.js";

/**
 * Get word count from entropy bits
 *
 * @param {number} entropyBits - Entropy in bits
 * @returns {number} Number of words in mnemonic
 *
 * @example
 * ```typescript
 * Bip39.getWordCount(128); // 12
 * Bip39.getWordCount(256); // 24
 * ```
 */
export function getWordCount(entropyBits) {
	if (entropyBits % 32 !== 0 || entropyBits < 128 || entropyBits > 256) {
		throw new InvalidEntropyError(
			"Entropy must be 128, 160, 192, 224, or 256 bits",
		);
	}
	return (entropyBits / 32) * 3;
}
