import { type MnemonicStrength, WORD_COUNTS } from "./types.js";

/**
 * Splits a BIP-39 mnemonic sentence into words.
 *
 * @param mnemonic - Space-separated mnemonic sentence
 * @returns Array of mnemonic words
 */
export const mnemonicToWords = (mnemonic: string): string[] => {
	return mnemonic
		.normalize("NFKD")
		.split(" ")
		.filter((word) => word.length > 0);
};

/**
 * Joins mnemonic words into a space-separated sentence.
 *
 * @param words - Array of mnemonic words
 * @returns Space-separated mnemonic sentence
 */
export const wordsToMnemonic = (words: readonly string[]): string => {
	return words.join(" ");
};

/**
 * Validates mnemonic word count per BIP-39.
 *
 * @param mnemonic - Space-separated mnemonic sentence
 * @returns True if word count is valid (12, 15, 18, 21, or 24)
 */
export const validateWordCount = (mnemonic: string): boolean => {
	const count = mnemonicToWords(mnemonic).length;
	return [12, 15, 18, 21, 24].includes(count);
};

/**
 * Gets the expected word count for an entropy strength.
 */
export const getWordCount = (strength: MnemonicStrength): number => {
	return WORD_COUNTS[strength];
};
