import { Bip39Error } from "./errors.js";

/**
 * Get entropy bits from word count
 *
 * @param {number} wordCount - Number of words
 * @returns {number} Entropy in bits
 *
 * @example
 * ```typescript
 * Bip39.getEntropyBits(12); // 128
 * Bip39.getEntropyBits(24); // 256
 * ```
 */
export function getEntropyBits(wordCount) {
	if (![12, 15, 18, 21, 24].includes(wordCount)) {
		throw new Bip39Error("Word count must be 12, 15, 18, 21, or 24");
	}
	return (wordCount / 3) * 32;
}
